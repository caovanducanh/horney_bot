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
            // Prepare title - ensure it's descriptive
            let displayTitle = video.title;
            if (video.videoCode && !displayTitle.includes(video.videoCode)) {
                displayTitle = `${displayTitle} (${video.videoCode})`;
            }
            
            // Create detailed embed with video information
            const embed = new EmbedBuilder()
                .setTitle(displayTitle)
                .setURL(video.url)
                .setColor(CONFIG.COLORS.PRIMARY)
                .setDescription(`🔥 **Phim HOT ngẫu nhiên từ MissAV** 🔥

📋 **Mã phim:** \`${video.videoCode || 'N/A'}\`
🔞 *Chỉ dành cho người trên 18 tuổi*

⚡ *Click vào tiêu đề để xem video*`)
                .setFooter({ 
                    text: `🎲 Random Hot Video | ${new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}`,
                    iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
                })
                .setTimestamp();

            // Add thumbnail image if available
            if (video.image) {
                embed.setImage(video.image);
            }

            // Add additional fields for better presentation
            if (video.videoCode) {
                embed.addFields({
                    name: '📋 Video Code',
                    value: `\`${video.videoCode}\``,
                    inline: true
                });
            }

            const message = await this.channel.send({ embeds: [embed] });
            console.log(`✅ Đã gửi embed: ${video.title} (${video.videoCode || 'No code'}) - ${video.url}`);
            return true;
        } catch (error) {
            console.error('❌ Lỗi khi gửi embed:', error.message);
            
            // Fallback: gửi text message với thông tin đầy đủ
            try {
                const fallbackMessage = `🔥 **${video.title}**
📋 **Mã phim:** \`${video.videoCode || 'N/A'}\`
🔗 **Link:** ${video.url}
🔞 Chỉ dành cho 18+ | Random Hot Video`;

                await this.channel.send(fallbackMessage);
                console.log(`✅ Đã gửi (text fallback): ${video.title} (${video.videoCode || 'No code'})`);
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
            
            // Use only regular crawler with Puppeteer bypass (most reliable)
            const video = await this.crawler.getRandomHotVideo();
            
            if (!video) {
                console.log('❌ Không lấy được video');
                return false;
            }

            // Validate result - reject bad URLs
            if (video.url.includes('/genres') || video.url.includes('/vip') || 
                video.url.includes('/makers') || video.url.includes('/categories')) {
                console.log('⚠️ Bad URL detected, trying again...');
                return await this.sendRandomVideo(); // Retry once
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
            
            // Use the same method as auto sending to ensure consistent format
            const success = await this.sendRandomVideo();
            if (!success) {
                await message.channel.send(CONFIG.MESSAGES.ERROR);
            }
        } catch (error) {
            console.error('❌ Lỗi khi xử lý lệnh #link:', error.message);
            await message.channel.send(CONFIG.MESSAGES.FALLBACK_ERROR);
        }
    }

    // Cleanup resources when shutting down
    async cleanup() {
        this.stopAutoSending();
        if (this.crawler && this.crawler.closeBrowser) {
            await this.crawler.closeBrowser();
        }
    }
}

module.exports = DiscordService;
