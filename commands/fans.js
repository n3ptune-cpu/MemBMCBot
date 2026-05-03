const { SlashCommandBuilder } = require('discord.js');
const { exec } = require('child_process');
require('dotenv').config({ quiet: true });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fans')
        .setDescription('Fan Management & Status')
        .addSubcommand(sub => 
            sub.setName('set')
               .setDescription('Change fan profile')
               .addStringOption(opt => 
                   opt.setName('profile').setDescription('Select mode').setRequired(true)
                      .addChoices(
                          { name: 'Standard', value: '00' },
                          { name: 'Full Speed', value: '01' },
                          { name: 'HeavyIO', value: '04' }
                      )))
        .addSubcommand(sub => sub.setName('status').setDescription('Check current fan mode')),

    async execute(interaction, logCallback) {
        const userWhitelist = process.env.WHITELISTED_USERS.split(',');
        const channelWhitelist = process.env.WHITELISTED_CHANNELS.split(',');
        const sub = interaction.options.getSubcommand();

        if (!userWhitelist.includes(interaction.user.id) || !channelWhitelist.includes(interaction.channelId)) {
            return interaction.reply({ content: '🚫 **Security Denied.**', ephemeral: true });
        }

        await interaction.deferReply();

        const modeMap = { '00': 'Standard', '01': 'Full Speed', '04': 'HeavyIO' };
        
        if (sub === 'status') {
            const cmd = `ipmitool -I lanplus -H ${process.env.BMC_IP} -U ${process.env.BMC_USER} -P ${process.env.BMC_PASS} raw 0x30 0x45 0x00`;
            exec(cmd, (error, stdout) => {
                const hex = stdout.trim();
                const modeName = modeMap[hex] || `Unknown Hex (${hex})`;
                interaction.editReply(`🌀 **Current Fan Mode:** \`${modeName}\``);
            });
        } else {
            const mode = interaction.options.getString('profile');
            const cmd = `ipmitool -I lanplus -H ${process.env.BMC_IP} -U ${process.env.BMC_USER} -P ${process.env.BMC_PASS} raw 0x30 0x45 0x01 0x${mode}`;
            exec(cmd, (error) => {
                if (error) return interaction.editReply(`❌ Error setting mode.`);
                interaction.editReply(`✅ **Fan profile updated to:** \`${modeMap[mode]}\``);
            });
        }
    },
};