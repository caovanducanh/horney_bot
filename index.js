require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const keepAlive = require('./keep_alive');

// Create Express app for Zeabur
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send(`
        <h1>🤖 ${process.env.BOT_NAME || 'Horney Bot'} is alive! ✅</h1>
        <p><strong>Version:</strong> ${process.env.BOT_VERSION || '1.0.0'}</p>
        <p><strong>Status:</strong> Online</p>
        <p><strong>Port:</strong> ${port}</p>
        <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
                <p><strong>Repl URL:</strong> ${process.env.ZEABUR_URL || 'localhost'}</p>
        <hr>
        <p><a href="/status">📊 JSON Status</a></p>
        <p><a href="/env">🔧 Environment Info</a></p>
    `);
});

app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        bot: client.user ? client.user.tag : 'Not logged in',
        uptime: process.uptime(),
        port: port,
        environment: process.env.NODE_ENV || 'development',
        zeabur_url: process.env.ZEABUR_URL || 'localhost',
        version: process.env.BOT_VERSION || '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/env', (req, res) => {
    res.json({
        message: 'Environment Variables (Safe)',
        bot_name: process.env.BOT_NAME || 'Horney Bot',
        bot_version: process.env.BOT_VERSION || '1.0.0',
        node_env: process.env.NODE_ENV || 'development',
        port: process.env.PORT || '8080',
        zeabur_url: process.env.ZEABUR_URL || 'localhost',
        ping_interval: process.env.PING_INTERVAL || '300000',
        health_check: process.env.HEALTH_CHECK || 'true',
        has_discord_token: !!process.env.DISCORD_TOKEN
    });
});

// Start web server
app.listen(port, () => {
    console.log(`🌐 Web server running on port ${port}`);
    console.log(`🤖 ${process.env.BOT_NAME || 'Bot'} v${process.env.BOT_VERSION || '1.0.0'}`);
});

// Start keep alive function
keepAlive();

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
