const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config({ quiet: true });

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

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
    console.log(`[${new Date().toLocaleString()}] ✅ Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const timestamp = new Date().toLocaleString();
    
    // SAFE LOGGING: Check if a subcommand exists before trying to grab it
    let sub = '';
    try {
        sub = interaction.options.getSubcommand(false) || '';
    } catch (e) {
        // If there's no subcommand (like in /fans), it just stays empty
    }

    console.log(`[${timestamp}] CMD: /${interaction.commandName} ${sub} | User: ${interaction.user.tag}`);

    try {
        await command.execute(interaction, (ipmiOutput) => {
            console.log(`[${new Date().toLocaleString()}] IPMI LOG: ${ipmiOutput.trim()}`);
        });
    } catch (error) {
        console.error(`[${timestamp}] CRITICAL ERROR:`, error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'Error executing command.', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);