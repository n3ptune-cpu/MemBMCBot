const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, ActivityType, PresenceUpdateStatus } = require('discord.js');
const { exec } = require('child_process');
require('dotenv').config({ quiet: true });

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// --- SMART STATUS & ENHANCED LOGGING ---
const updateStatus = (c) => {
    const bmcBase = `ipmitool -I lanplus -H ${process.env.BMC_IP} -U ${process.env.BMC_USER} -P ${process.env.BMC_PASS}`;
    const now = () => new Date().toLocaleString();
    
    exec(`${bmcBase} chassis power status`, (error, stdout) => {
        let statusText = "System Status Unknown";
        let presence = PresenceUpdateStatus.Online;
        let logMsg = "";

        if (error) {
            statusText = "Cannot reach the BMC/Host ⚠️";
            presence = PresenceUpdateStatus.DoNotDisturb;
            logMsg = `[${now()}] ❌ STATUS ADVISORY: BMC unreachable or session timeout.`;
        } else if (stdout.toLowerCase().includes('is on')) {
            statusText = "Host: Online and Running! ⚡";
            presence = PresenceUpdateStatus.Online;
            logMsg = `[${now()}] 🟢 STATUS UPDATE: Host is ONLINE.`;
        } else if (stdout.toLowerCase().includes('is off')) {
            statusText = "Host: Powered off or Sleeping... 🌙";
            presence = PresenceUpdateStatus.Idle;
            logMsg = `[${now()}] 🟠 STATUS UPDATE: Host is SLEEPING/OFF.`;
        }

        c.user.setPresence({
            activities: [{ name: statusText, type: ActivityType.Watching }],
            status: presence,
        });
        
        console.log(logMsg);
    });
};

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

client.once(Events.ClientReady, c => {
    console.log(`[${new Date().toLocaleString()}] ✅ SYSTEM READY: Logged in as ${c.user.tag}`);
    console.log(`[${new Date().toLocaleString()}] 📡 MONITORING: Starting BMC polling (5min interval).`);
    
    updateStatus(c);
    setInterval(() => updateStatus(c), 300000);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const timestamp = new Date().toLocaleString();
    let sub = '';
    try { sub = interaction.options.getSubcommand(false) || ''; } catch (e) {}

    console.log(`[${timestamp}] 📥 INTERACTION: /${interaction.commandName} ${sub} | User: ${interaction.user.tag}`);

    try {
        await command.execute(interaction, (ipmiOutput) => {
            const sanitized = ipmiOutput
                .replace(new RegExp(process.env.BMC_PASS, 'g'), '********')
                .replace(new RegExp(process.env.BMC_USER, 'g'), '********')
                .replace(new RegExp(process.env.BMC_IP, 'g'), 'xxx.xxx.xxx.xxx');
            console.log(`[${new Date().toLocaleString()}] 🛰️ IPMI OUTPUT: ${sanitized.trim()}`);
        });
    } catch (error) {
        console.error(`[${timestamp}] 🛑 CRITICAL EXECUTION ERROR:`, error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'Error executing command.', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);