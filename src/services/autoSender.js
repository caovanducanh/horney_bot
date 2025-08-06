/**
 * Auto Sender Service - Handles scheduled video sending
 */

const CONFIG = require('../config/constants');
const crawler = require('./crawler');
const messageService = require('./messageService');

class AutoSenderService {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
        this.channel = null;
    }

    /**
     * Bắt đầu gửi video tự động
     */
    async start(client) {
        try {
            this.channel = await client.channels.fetch(CONFIG.CHANNEL_ID);
            if (!this.channel) {
                console.error('❌ Không tìm thấy kênh.');
                return false;
            }

            console.log(`🤖 Bắt đầu gửi phim HOT random mỗi 5 phút vào kênh: ${this.channel.name}`);
            
            // Gửi video đầu tiên ngay lập tức
            await this.sendVideo();
            
            // Thiết lập interval để gửi định kỳ
            this.intervalId = setInterval(async () => {
                console.log('⏰ Đến giờ gửi video tự động...');
                await this.sendVideo();
            }, CONFIG.AUTO_SEND_INTERVAL);
            
            this.isRunning = true;
            return true;

        } catch (err) {
            console.error('❌ Lỗi khi thiết lập auto sending:', err.message);
            return false;
        }
    }

    /**
     * Dừng gửi video tự động
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('⏹️ Đã dừng gửi video tự động');
    }

    /**
     * Gửi video
     */
    async sendVideo() {
        if (!this.channel) {
            console.error('❌ Channel không khả dụng');
            return false;
        }

        try {
            const video = await crawler.getRandomHotVideo();
            if (!video) {
                console.log('❌ Không lấy được video');
                return false;
            }

            return await messageService.sendVideoToChannel(this.channel, video);

        } catch (err) {
            console.error('❌ Lỗi khi gửi video tự động:', err.message);
            return false;
        }
    }

    /**
     * Gửi video theo yêu cầu (lệnh #link)
     */
    async sendVideoOnDemand(channel, userTag) {
        try {
            console.log(`🎬 ${userTag} yêu cầu link video hot random`);
            
            // Gửi thông báo đang tìm kiếm
            const searchMsg = await messageService.sendSearchingMessage(channel);
            
            // Lấy video
            const video = await crawler.getRandomHotVideo();
            if (!video) {
                await messageService.sendErrorMessage(channel);
                return false;
            }

            // Xóa tin nhắn "đang tìm kiếm" nếu có
            if (searchMsg) {
                try {
                    await searchMsg.delete();
                } catch (deleteErr) {
                    // Ignore delete error
                }
            }

            // Gửi video
            return await messageService.sendVideoToChannel(channel, video);

        } catch (err) {
            console.error('❌ Lỗi khi xử lý lệnh #link:', err.message);
            await messageService.sendErrorMessage(channel, CONFIG.MESSAGES.FALLBACK_ERROR);
            return false;
        }
    }

    /**
     * Lấy trạng thái hiện tại
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            hasChannel: !!this.channel,
            channelName: this.channel ? this.channel.name : null,
            interval: CONFIG.AUTO_SEND_INTERVAL / 1000 / 60 // minutes
        };
    }
}

module.exports = new AutoSenderService();
