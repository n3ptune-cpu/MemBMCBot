const { SlashCommandBuilder } = require('discord.js');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
require('dotenv').config({ quiet: true });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('power')
        .setDescription('Chassis Power Control & Status')
        .addSubcommand(sub => sub.setName('status').setDescription('Check if the server is ON or OFF'))
        .addSubcommand(sub => sub.setName('on').setDescription('Normal Power On'))
        .addSubcommand(sub => sub.setName('wake').setDescription('Session-aware triple-pulse wake'))
        .addSubcommand(sub => sub.setName('off').setDescription('Hard power off'))
        .addSubcommand(sub => sub.setName('reset').setDescription('Hard reboot'))
        .addSubcommand(sub => sub.setName('sleep').setDescription('Soft power button'))
        .addSubcommand(sub => sub.setName('bmc-reset').setDescription('Manually reboot the BMC')),

    async execute(interaction, logCallback) {
        const userWhitelist = (process.env.WHITELISTED_USERS || '').split(',');
        const channelWhitelist = (process.env.WHITELISTED_CHANNELS || '').split(',');
        const sub = interaction.options.getSubcommand();

        if (!userWhitelist.includes(interaction.user.id) || !channelWhitelist.includes(interaction.channelId)) {
            return interaction.reply({ content: '🚫 **Security Denied.**', ephemeral: true });
        }

        await interaction.deferReply();

        const bmcBase = `ipmitool -I lanplus -H ${process.env.BMC_IP} -U ${process.env.BMC_USER} -P ${process.env.BMC_PASS}`;
        
        const sanitize = (str) => {
            if (!str) return '';
            return str.replace(new RegExp(process.env.BMC_PASS, 'g'), '********')
                      .replace(new RegExp(process.env.BMC_USER, 'g'), '********')
                      .replace(new RegExp(process.env.BMC_IP, 'g'), 'xxx.xxx.xxx.xxx');
        };

        const safeLog = (msg) => {
            if (logCallback) logCallback(sanitize(msg));
        };

        const isHostOn = async () => {
            try {
                const { stdout } = await execPromise(`${bmcBase} chassis power status`);
                return stdout.toLowerCase().includes('is on');
            } catch (err) {
                if (err.message.includes('Unable to establish IPMI')) {
                    safeLog(`BMC Session Busy. Retrying in 5s...`);
                    await new Promise(r => setTimeout(r, 5000));
                    return isHostOn(); // Single retry for session hang
                }
                return false; 
            }
        };

        if (sub === 'bmc-reset') {
            exec(`${bmcBase} mc reset cold`, (error) => {
                interaction.editReply(`🔄 **Manual BMC Reset initiated.** ~100s downtime.`);
                setTimeout(() => interaction.followUp(`✅ **BMC Online.**`), 100000);
            });
            return;
        }

        if (sub === 'wake') {
            interaction.editReply(`🔌 **Safe Wake Initiated.** Checking state...`);

            const attemptPulse = async (num) => {
                const currentlyOn = await isHostOn(); 
                if (currentlyOn) {
                    safeLog(`Pulse ${num} skipped: Host is already ON.`);
                    return true; 
                }
                
                try {
                    safeLog(`Pulse ${num}: Host is OFF. Sending signal...`);
                    await execPromise(`${bmcBase} chassis power on`);
                    return false;
                } catch (e) {
                    safeLog(`Pulse ${num} failed (Session Error).`);
                    return false;
                }
            };

            let success = await attemptPulse(1);
            if (!success) { await new Promise(r => setTimeout(r, 8000)); success = await attemptPulse(2); }
            if (!success) { await new Promise(r => setTimeout(r, 8000)); success = await attemptPulse(3); }

            const statusUpdate = await interaction.followUp(`⏳ **Sequence complete.** Verifying stability...`);
            
            setTimeout(async () => {
                const finalCheck = await isHostOn();
                if (finalCheck) {
                    statusUpdate.edit(`✅ **Host is ON.** Fixing sensors...`);
                    exec(`${bmcBase} mc reset cold`);
                    setTimeout(() => interaction.followUp(`✅ **BMC Online.** Sensors fixed.`), 100000);
                } else {
                    statusUpdate.edit(`⚠️ **Wake Failed.** Host is OFF or BMC is unresponsive.`);
                }
            }, 15000);
            return;
        }

        const actionMap = { 'status': 'status', 'on': 'on', 'off': 'off', 'reset': 'reset', 'sleep': 'soft' };
        const cmd = `${bmcBase} chassis power ${actionMap[sub]}`;

        exec(cmd, (error, stdout) => {
            const result = error ? error.message : stdout;
            safeLog(`Power ${sub}: ${result}`);
            interaction.editReply(`🔌 **Power ${sub.toUpperCase()}:** \`${sanitize(result).trim()}\``);
        });
    }
};