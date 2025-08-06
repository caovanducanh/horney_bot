const { Client, GatewayIntentBits } = require('discord.js');
const Logger = require('../utils/logger');
const CommandHandler = require('../handlers/commandHandler');
const AutoSenderService = require('../services/autoSenderService');

/**
 * Discord Bot Client Manager
 */
class BotClient {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });
        
        this.commandHandler = null;
        this.autoSender = null;
        this.isReady = false;
    }
    
    /**
     * Initialize event handlers
     */
    initializeEvents() {
        // Bot ready event
        this.client.once('ready', () => {
            this.isReady = true;
            Logger.bot('Bot is ready!');
            Logger.fire(`Logged in as ${this.client.user.tag}`);
            
            // Initialize services
            this.commandHandler = new CommandHandler(this.client);
            this.autoSender = new AutoSenderService(this.client);
            
            // Start auto sender
            this.autoSender.start();
        });
        
        // Message handling
        this.client.on('messageCreate', async (message) => {
            if (!this.isReady || !this.commandHandler) return;
            
            try {
                await this.commandHandler.processMessage(message);
            } catch (error) {
                Logger.error('Error in message handler', error);
            }
        });
        
        // Error handling
        this.client.on('error', (error) => {
            Logger.error('Discord client error', error);
        });
        
        // Warning handling
        this.client.on('warn', (warning) => {
            Logger.warning('Discord client warning', warning);
        });
        
        // Debug events (only in development)
        if (process.env.NODE_ENV === 'development') {
            this.client.on('debug', (info) => {
                Logger.debug('Discord debug', info);
            });
        }
    }
    
    /**
     * Login to Discord
     */
    async login(token) {
        if (!token) {
            throw new Error('Discord token is required');
        }
        
        try {
            Logger.info('Connecting to Discord...');
            await this.client.login(token);
            Logger.success('Successfully connected to Discord');
        } catch (error) {
            Logger.error('Failed to connect to Discord', error);
            throw error;
        }
    }
    
    /**
     * Graceful shutdown
     */
    async shutdown() {
        Logger.info('Shutting down bot...');
        
        if (this.autoSender) {
            this.autoSender.stop();
        }
        
        if (this.client) {
            await this.client.destroy();
        }
        
        Logger.success('Bot shutdown complete');
    }
    
    /**
     * Get bot status
     */
    getStatus() {
        return {
            ready: this.isReady,
            user: this.client.user ? this.client.user.tag : null,
            guilds: this.client.guilds.cache.size,
            uptime: this.client.uptime,
            autoSender: this.autoSender ? this.autoSender.getStatus() : null
        };
    }
    
    /**
     * Get the Discord client instance
     */
    getClient() {
        return this.client;
    }
}

module.exports = BotClient;
