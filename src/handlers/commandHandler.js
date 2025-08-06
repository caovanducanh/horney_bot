const Logger = require('../utils/logger');
const CONFIG = require('../config/constants');
const MissAVCrawler = require('../services/missavCrawler');
const DiscordService = require('../services/discordService');

/**
 * Command Handler for Discord messages
 */
class CommandHandler {
    constructor(client) {
        this.client = client;
        this.discordService = new DiscordService(client);
        this.crawler = new MissAVCrawler();
    }
    
    /**
     * Handle ping command
     */
    async handlePingCommand(message) {
        try {
            Logger.info(`${message.author.tag} requested ping`);
            
            const sent = await message.reply('🏓 Calculating ping...');
            const latency = sent.createdTimestamp - message.createdTimestamp;
            
            await sent.edit(`🏓 Pong! Latency is **${latency}ms**`);
            
        } catch (error) {
            Logger.error('Error handling ping command', error.message);
            await message.reply('❌ Error calculating ping');
        }
    }
    
    /**
     * Handle link command - send random video immediately
     */
    async handleLinkCommand(message) {
        try {
            Logger.video(`${message.author.tag} requested random hot video`);
            
            // Send searching message
            const searchingMsg = await message.reply(CONFIG.MESSAGES.SEARCHING);
            
            // Get random video
            let videoData = await this.crawler.getRandomHotVideo();
            
            // Try fallback if main method fails
            if (!videoData) {
                Logger.warning('Main crawler failed, trying fallback...');
                videoData = await this.crawler.getFallbackVideo();
            }
            
            if (!videoData) {
                Logger.error('No video data available for link command');
                await searchingMsg.edit(CONFIG.MESSAGES.NO_VIDEO);
                return;
            }
            
            // Delete searching message
            await searchingMsg.delete();
            
            // Send video to channel
            const success = await this.discordService.sendVideoToChannel(
                message.channel.id, 
                videoData
            );
            
            if (!success) {
                await message.channel.send(CONFIG.MESSAGES.ERROR);
            }
            
        } catch (error) {
            Logger.error('Error handling link command', error.message);
            await message.channel.send(CONFIG.MESSAGES.FALLBACK_ERROR);
        }
    }
    
    /**
     * Handle help command
     */
    async handleHelpCommand(message) {
        const helpMessage = `
🤖 **Horney Bot Commands**

**Available Commands:**
• \`#ping\` - Check bot latency
• \`#link\` - Get random hot JAV video immediately
• \`#help\` - Show this help message

**Auto Features:**
• 🔄 Sends random hot videos every 5 minutes
• 🎲 Videos are randomly selected from hot/trending
• 🔞 Adult content (18+)

**Bot Status:**
• ✅ Online and active
• 🎯 Target channel: <#${CONFIG.CHANNEL_ID}>
• ⏰ Auto interval: ${CONFIG.AUTO_SEND_INTERVAL / 1000 / 60} minutes

*Use responsibly and follow Discord ToS*
        `;
        
        try {
            await message.reply(helpMessage);
        } catch (error) {
            Logger.error('Error sending help message', error.message);
        }
    }
    
    /**
     * Process message and handle commands
     */
    async processMessage(message) {
        // Ignore bot messages
        if (message.author.bot) return;
        
        const content = message.content.toLowerCase().trim();
        
        try {
            switch (content) {
                case '#ping':
                    await this.handlePingCommand(message);
                    break;
                    
                case '#link':
                    await this.handleLinkCommand(message);
                    break;
                    
                case '#help':
                    await this.handleHelpCommand(message);
                    break;
                    
                default:
                    // Ignore non-command messages
                    break;
            }
        } catch (error) {
            Logger.error('Error processing message', error);
        }
    }
}

module.exports = CommandHandler;
