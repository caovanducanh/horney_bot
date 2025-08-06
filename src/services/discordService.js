const { EmbedBuilder } = require('discord.js');
const CrawlerService = require('./crawlerService');
const CONFIG = require('../config/constants');

class DiscordService {
    constructor(client) {
        this.client = client;
        this.crawler = new CrawlerService();
        this.channel = null;
        this.autoSendInterval = null;
    }

    async initialize() {
        try {
            this.channel = await this.client.channels.fetch(CONFIG.CHANNEL_ID);
            if (!this.channel) {
                console.error('❌ Không tìm thấy channel');
                return false;
            }
            console.log(`✅ Đã kết nối channel: ${this.channel.name}`);
            return true;
        } catch (error) {
            console.error('❌ Lỗi khi khởi tạo Discord service:', error.message);
            return false;
        }
    }

    async sendVideoMessage(video) {
        if (!this.channel || !video) {
            console.log('❌ Không có channel hoặc video để gửi');
            return false;
        }

        try {
            const embed = new EmbedBuilder()
                .setTitle(video.title)
                .setURL(video.url)
                .setColor(CONFIG.COLORS.PRIMARY)
                .setDescription('🔥 **Phim HOT ngẫu nhiên từ MissAV** 🔥\n\n🔞 *Chỉ dành cho người trên 18 tuổi*')
                .setFooter({ 
                    text: `🎲 Random Hot Video | ${new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}`,
                    iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
                })
                .setTimestamp();

            if (video.image) {
                embed.setImage(video.image);
            }

            const message = await this.channel.send({ embeds: [embed] });
            console.log(`✅ Đã gửi: ${video.title}`);
            return true;
        } catch (error) {
            console.error('❌ Lỗi khi gửi embed:', error.message);
            
            // Fallback: gửi text message
            try {
                await this.channel.send(`🔥 **${video.title}**\n🔗 ${video.url}\n🔞 Chỉ dành cho 18+ | Random Hot Video`);
                console.log(`✅ Đã gửi (text fallback): ${video.title}`);
                return true;
            } catch (fallbackError) {
                console.error('❌ Lỗi cả text fallback:', fallbackError.message);
                return false;
            }
        }
    }

    async sendRandomVideo() {
        try {
            console.log('🎲 Đang lấy video random...');
            const video = await this.crawler.getRandomHotVideo();
            
            if (!video) {
                console.log('❌ Không lấy được video');
                return false;
            }

            return await this.sendVideoMessage(video);
        } catch (error) {
            console.error('❌ Lỗi khi gửi video random:', error.message);
            return false;
        }
    }

    startAutoSending() {
        if (!this.channel) {
            console.error('❌ Channel chưa được khởi tạo');
            return;
        }

        console.log(`🤖 Bắt đầu gửi phim HOT random mỗi ${CONFIG.AUTO_SEND_INTERVAL / 60000} phút`);
        
        // Gửi video đầu tiên ngay lập tức
        this.sendRandomVideo();
        
        // Thiết lập interval gửi tự động
        this.autoSendInterval = setInterval(async () => {
            console.log('⏰ Đến giờ gửi video tự động...');
            await this.sendRandomVideo();
        }, CONFIG.AUTO_SEND_INTERVAL);
    }

    stopAutoSending() {
        if (this.autoSendInterval) {
            clearInterval(this.autoSendInterval);
            this.autoSendInterval = null;
            console.log('🛑 Đã dừng gửi tự động');
        }
    }

    async handlePingCommand(message) {
        try {
            const sent = await message.reply('Calculating ping...');
            const latency = sent.createdTimestamp - message.createdTimestamp;
            await sent.edit(`🏓 Pong! Latency is ${latency}ms.`);
        } catch (error) {
            console.error('❌ Lỗi khi xử lý ping:', error.message);
        }
    }

    async handleLinkCommand(message) {
        try {
            console.log(`🎬 ${message.author.tag} yêu cầu link video hot random`);
            await message.reply(CONFIG.MESSAGES.SEARCHING);
            
            const success = await this.sendRandomVideo();
            if (!success) {
                await message.channel.send(CONFIG.MESSAGES.ERROR);
            }
        } catch (error) {
            console.error('❌ Lỗi khi xử lý lệnh #link:', error.message);
            await message.channel.send(CONFIG.MESSAGES.FALLBACK_ERROR);
        }
    }
}

module.exports = DiscordService;
