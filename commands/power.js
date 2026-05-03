const { SlashCommandBuilder } = require('discord.js');
const { exec } = require('child_process');
require('dotenv').config({ quiet: true });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('power')
        .setDescription('Chassis Power Control & Status')
        .addSubcommand(sub => sub.setName('status').setDescription('Check if the server is ON or OFF'))
        .addSubcommand(sub => sub.setName('wake').setDescription('Power on the server'))
        .addSubcommand(sub => sub.setName('off').setDescription('Hard power off (Immediate)'))
        .addSubcommand(sub => sub.setName('reset').setDescription('Hard reboot'))
        .addSubcommand(sub => sub.setName('sleep').setDescription('Soft power button')),

    async execute(interaction, logCallback) {
        const userWhitelist = process.env.WHITELISTED_USERS.split(',');
        const channelWhitelist = process.env.WHITELISTED_CHANNELS.split(',');
        const sub = interaction.options.getSubcommand();

        if (!userWhitelist.includes(interaction.user.id) || !channelWhitelist.includes(interaction.channelId)) {
            return interaction.reply({ content: '🚫 **Security Denied.**', ephemeral: true });
        }

        await interaction.deferReply();

        const actionMap = { 'status': 'status', 'wake': 'on', 'off': 'off', 'reset': 'reset', 'sleep': 'soft' };
        const cmd = `ipmitool -I lanplus -H ${process.env.BMC_IP} -U ${process.env.BMC_USER} -P ${process.env.BMC_PASS} chassis power ${actionMap[sub]}`;

        exec(cmd, (error, stdout, stderr) => {
            const result = error ? (stderr || error.message) : stdout;
            if (logCallback) logCallback(`Power ${sub}: ${result}`);
            interaction.editReply(`🔌 **Power ${sub.toUpperCase()}:** \`${result.trim()}\``);
        });
    },
};