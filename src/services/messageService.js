/**
 * Discord Message Service
 */

const { EmbedBuilder } = require('discord.js');
const CONFIG = require('../config/constants');

class MessageService {
    constructor() {
        this.timezone = 'Asia/Ho_Chi_Minh';
    }

    /**
     * Tạo embed cho video JAV
     */
    createVideoEmbed(video) {
        if (!video || !video.title || !video.url) {
            throw new Error('Video data is invalid');
        }

        const embed = new EmbedBuilder()
            .setTitle(video.title)
            .setURL(video.url)
            .setColor(CONFIG.COLORS.PRIMARY)
            .setDescription('🔥 **Phim HOT ngẫu nhiên từ MissAV** 🔥\n\n🔞 *Chỉ dành cho người trên 18 tuổi*')
            .setFooter({ 
                text: `🎲 Random Hot Video | ${this.getCurrentTime()}`,
                iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
            })
            .setTimestamp();

        if (video.image) {
            embed.setImage(video.image);
        }

        return embed;
    }

    /**
     * Gửi video embed vào channel
     */
    async sendVideoToChannel(channel, video) {
        if (!channel || !video) {
            console.log(CONFIG.MESSAGES.NO_VIDEO);
            return false;
        }

        try {
            const embed = this.createVideoEmbed(video);
            const message = await channel.send({ embeds: [embed] });
            
            console.log(`${CONFIG.MESSAGES.SUCCESS}: ${video.title}`);
            console.log(`📨 Message ID: ${message.id}`);
            return true;

        } catch (err) {
            console.error('❌ Lỗi khi gửi embed:', err.message);
            return await this.sendFallbackMessage(channel, video);
        }
    }

    /**
     * Gửi tin nhắn text đơn giản khi embed lỗi
     */
    async sendFallbackMessage(channel, video) {
        try {
            const message = await channel.send(
                `🔥 **${video.title}**\n🔗 ${video.url}\n🔞 Chỉ dành cho 18+ | Random Hot Video`
            );
            
            console.log(`✅ Đã gửi (text fallback): ${video.title}`);
            return true;

        } catch (fallbackErr) {
            console.error('❌ Lỗi cả text fallback:', fallbackErr.message);
            return false;
        }
    }

    /**
     * Gửi thông báo lỗi
     */
    async sendErrorMessage(channel, errorMsg = null) {
        try {
            const message = errorMsg || CONFIG.MESSAGES.ERROR;
            await channel.send(message);
            return true;
        } catch (err) {
            console.error('❌ Không thể gửi thông báo lỗi:', err.message);
            return false;
        }
    }

    /**
     * Gửi thông báo đang tìm kiếm
     */
    async sendSearchingMessage(channel) {
        try {
            return await channel.send(CONFIG.MESSAGES.SEARCHING);
        } catch (err) {
            console.error('❌ Không thể gửi thông báo tìm kiếm:', err.message);
            return null;
        }
    }

    /**
     * Lấy thời gian hiện tại theo timezone
     */
    getCurrentTime() {
        return new Date().toLocaleString('vi-VN', {
            timeZone: this.timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Tạo ping embed
     */
    createPingEmbed(latency) {
        const color = latency < 100 ? CONFIG.COLORS.SUCCESS : 
                     latency < 300 ? CONFIG.COLORS.WARNING : 
                     CONFIG.COLORS.ERROR;

        return new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setDescription(`⚡ **Latency:** ${latency}ms`)
            .setColor(color)
            .setTimestamp()
            .setFooter({ 
                text: `Bot Response Time | ${this.getCurrentTime()}`,
                iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
            });
    }
}

module.exports = new MessageService();
