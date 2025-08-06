require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const keepAlive = require('./keep_alive');
const DiscordService = require('./src/services/discordService');
const CONFIG = require('./src/config/constants');

// Express app setup
const app = express();
const port = process.env.PORT || 8080;

// Web routes
app.get('/', (req, res) => {
    res.send(`
        <h1>🤖 ${process.env.BOT_NAME || 'Horney Bot'} is alive! ✅</h1>
        <p><strong>Version:</strong> ${process.env.BOT_VERSION || '1.0.0'}</p>
        <p><strong>Status:</strong> Online</p>
        <p><strong>Port:</strong> ${port}</p>
        <p><strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        <p><strong>Target Channel:</strong> ${CONFIG.CHANNEL_ID}</p>
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
        version: process.env.BOT_VERSION || '1.0.0',
        targetChannel: CONFIG.CHANNEL_ID,
        autoSendInterval: `${CONFIG.AUTO_SEND_INTERVAL / 60000} minutes`,
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
        has_discord_token: !!process.env.DISCORD_TOKEN,
        target_channel: CONFIG.CHANNEL_ID,
        auto_send_minutes: CONFIG.AUTO_SEND_INTERVAL / 60000
    });
});

// Start web server
app.listen(port, () => {
    console.log(`🌐 Web server running on port ${port}`);
    console.log(`🤖 ${process.env.BOT_NAME || 'Horney Bot'} v${process.env.BOT_VERSION || '1.0.0'}`);
});

// Start keep alive
keepAlive();

// Discord client setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Initialize Discord service
const discordService = new DiscordService(client);

// Bot ready event
client.once('ready', async () => {
    console.log('🤖 Bot is ready!');
    console.log(`🔥 Logged in as ${client.user.tag}`);
    
    // Initialize Discord service
    const initialized = await discordService.initialize();
    
    if (initialized) {
        // Start auto-sending videos
        discordService.startAutoSending();
    } else {
        console.error('❌ Failed to initialize Discord service');
    }
});

// Message handler
client.on('messageCreate', async message => {
    // Ignore bot messages
    if (message.author.bot) return;

    // Handle commands
    const content = message.content.toLowerCase().trim();
    
    switch (content) {
        case '#ping':
            await discordService.handlePingCommand(message);
            break;
            
        case '#link':
            await discordService.handleLinkCommand(message);
            break;
            
        default:
            // No action for other messages
            break;
    }
});

// Error handling
client.on('error', (error) => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

// Login
client.login(process.env.DISCORD_TOKEN);
