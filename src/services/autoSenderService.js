const CONFIG = require('../config/constants');
const Logger = require('../utils/logger');
const MissAVCrawler = require('../services/missavCrawler');
const DiscordService = require('../services/discordService');

/**
 * Auto Sender Service - Handles automatic video sending
 */
class AutoSenderService {
    constructor(client) {
        this.client = client;
        this.discordService = new DiscordService(client);
        this.crawler = new MissAVCrawler();
        this.intervalId = null;
        this.isRunning = false;
    }
    
    /**
     * Send a random video
     */
    async sendRandomVideo() {
        Logger.clock('Time to send automatic video...');
        
        try {
            // Get random video
            let videoData = await this.crawler.getRandomHotVideo();
            
            // Try fallback if main method fails
            if (!videoData) {
                Logger.warning('Main crawler failed, trying fallback...');
                videoData = await this.crawler.getFallbackVideo();
            }
            
            if (!videoData) {
                Logger.error('No video data available');
                await this.discordService.sendErrorMessage(
                    CONFIG.CHANNEL_ID, 
                    CONFIG.MESSAGES.NO_VIDEO
                );
                return false;
            }
            
            // Send to Discord
            const success = await this.discordService.sendVideoToChannel(
                CONFIG.CHANNEL_ID, 
                videoData
            );
            
            if (!success) {
                await this.discordService.sendErrorMessage(
                    CONFIG.CHANNEL_ID, 
                    CONFIG.MESSAGES.ERROR
                );
            }
            
            return success;
            
        } catch (error) {
            Logger.error('Error in sendRandomVideo', error.message);
            await this.discordService.sendErrorMessage(
                CONFIG.CHANNEL_ID, 
                CONFIG.MESSAGES.FALLBACK_ERROR
            );
            return false;
        }
    }
    
    /**
     * Start automatic sending
     */
    async start() {
        if (this.isRunning) {
            Logger.warning('Auto sender is already running');
            return;
        }
        
        try {
            // Verify channel exists
            const channelInfo = await this.discordService.getChannelInfo(CONFIG.CHANNEL_ID);
            if (!channelInfo) {
                Logger.error(`Cannot find channel: ${CONFIG.CHANNEL_ID}`);
                return;
            }
            
            Logger.bot(`Starting auto sender for channel: ${channelInfo.name} (${channelInfo.id})`);
            Logger.info(`Interval: ${CONFIG.AUTO_SEND_INTERVAL / 1000 / 60} minutes`);
            
            // Send first video immediately
            await this.sendRandomVideo();
            
            // Set up interval for subsequent videos
            this.intervalId = setInterval(async () => {
                await this.sendRandomVideo();
            }, CONFIG.AUTO_SEND_INTERVAL);
            
            this.isRunning = true;
            Logger.success('Auto sender started successfully');
            
        } catch (error) {
            Logger.error('Failed to start auto sender', error.message);
        }
    }
    
    /**
     * Stop automatic sending
     */
    stop() {
        if (!this.isRunning) {
            Logger.warning('Auto sender is not running');
            return;
        }
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.isRunning = false;
        Logger.info('Auto sender stopped');
    }
    
    /**
     * Get status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            intervalId: this.intervalId,
            channelId: CONFIG.CHANNEL_ID,
            interval: CONFIG.AUTO_SEND_INTERVAL
        };
    }
}

module.exports = AutoSenderService;
