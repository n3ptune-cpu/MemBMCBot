const { SlashCommandBuilder } = require('discord.js');
const { exec } = require('child_process');
require('dotenv').config({ quiet: true });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sensors')
        .setDescription('Retrieve all active hardware sensors'),

    async execute(interaction, logCallback) {
        const userWhitelist = process.env.WHITELISTED_USERS.split(',');
        const channelWhitelist = process.env.WHITELISTED_CHANNELS.split(',');

        if (!userWhitelist.includes(interaction.user.id) || !channelWhitelist.includes(interaction.channelId)) {
            return interaction.reply({ content: '🚫 **Security Denied.**', ephemeral: true });
        }

        await interaction.deferReply();

        // Getting all SDR data
        const cmd = `ipmitool -I lanplus -H ${process.env.BMC_IP} -U ${process.env.BMC_USER} -P ${process.env.BMC_PASS} sdr`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                if (logCallback) logCallback(`Sensor Error: ${stderr || error.message}`);
                return interaction.editReply(`❌ **Hardware Error:** Unable to reach BMC sensors.`);
            }

            // Split into lines and filter out anything that isn't reporting data
            const lines = stdout.split('\n');
            const activeSensors = lines.filter(line => {
                const lowerLine = line.toLowerCase();
                // Keep the line only if it DOES NOT contain these "empty" strings
                return !lowerLine.includes('no reading') && 
                       !lowerLine.includes('not present') && 
                       !lowerLine.includes(' ns ') &&
                       line.trim().length > 0;
            }).join('\n');

            if (logCallback) logCallback("Full active sensor suite retrieved.");

            // Formatting the output. Substring used to stay under Discord's 2000 char limit.
            interaction.editReply({
                content: `📊 **Active System Sensors:**\n\`\`\`text\n${activeSensors.substring(0, 1900)}\n\`\`\``
            });
        });
    },
};