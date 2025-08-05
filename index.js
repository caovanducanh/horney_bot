require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Bot is ready!');
});

// Listen for messages
client.on('messageCreate', async message => {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Check if the message starts with #ping
    if (message.content === '#ping') {
        // Calculate round-trip latency
        const sent = await message.reply('Calculating ping...');
        const latency = sent.createdTimestamp - message.createdTimestamp;
        
        // Edit the message with the calculated latency
        sent.edit(`Pong! Latency is ${latency}ms.`);
    }
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
