require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const keepAlive = require('./keep_alive');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

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

// Channel ID for sending JAV links
const CHANNEL_ID = '1402294476424089781';

// Hàm lấy phim hot random từ MissAV
async function getRandomHotMissAVVideo() {
  try {
    console.log('🔥 Đang lấy phim hot random từ MissAV...');
    
    // Thử các trang hot khác nhau
    const hotUrls = [
      'https://missav.com/en/hot',
      'https://missav.com/en/trending', 
      'https://missav.com/en/popular',
      'https://missav.com/en'
    ];
    
    let html = '';
    let selectedUrl = '';
    
    // Thử từng URL cho đến khi thành công
    for (const url of hotUrls) {
      try {
        console.log(`🔍 Đang thử: ${url}`);
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Upgrade-Insecure-Requests': '1'
          },
          timeout: 15000
        });
        
        if (res.ok) {
          html = await res.text();
          selectedUrl = url;
          console.log(`✅ Thành công với: ${url}`);
          break;
        }
      } catch (urlErr) {
        console.log(`❌ Lỗi với ${url}: ${urlErr.message}`);
        continue;
      }
    }
    
    if (!html) {
      throw new Error('Không thể truy cập bất kỳ URL nào');
    }
    
    const $ = cheerio.load(html);

    // Các selector để tìm video
    const videoSelectors = [
      '.group .thumbnail',
      '.thumbnail', 
      'a[href*="/en/"][href*="-"]',
      '.group a[href*="/en/"]',
      '.grid .thumbnail',
      '.movie-list a',
      'a[href*="missav.com/en/"]'
    ];
    
    let allVideos = [];
    
    // Lấy tất cả video từ các selector
    for (const selector of videoSelectors) {
      const videos = $(selector);
      console.log(`🔍 Selector "${selector}": ${videos.length} videos`);
      
      videos.each((i, element) => {
        const $el = $(element);
        let href = $el.attr('href');
        
        // Chỉ lấy link có dạng phim thực tế (có code JAV)
        if (href && href.includes('/en/') && href.match(/[A-Z]{2,}-?\d{3,}/)) {
          allVideos.push($el);
        }
      });
      
      if (allVideos.length >= 10) break; // Đủ rồi thì dừng
    }
    
    console.log(`🎬 Tìm thấy ${allVideos.length} video`);
    
    if (allVideos.length === 0) {
      throw new Error('Không tìm thấy video nào');
    }
    
    // Chọn random video
    const randomIndex = Math.floor(Math.random() * allVideos.length);
    const selectedVideo = allVideos[randomIndex];
    
    // Lấy thông tin video
    let href = selectedVideo.attr('href');
    const url = href && !href.startsWith('http') 
      ? `https://missav.com${href}` 
      : href;
    
    // Lấy title từ nhiều nguồn
    let title = selectedVideo.find('.text-secondary').text().trim() || 
               selectedVideo.find('img').attr('alt') || 
               selectedVideo.find('img').attr('title') ||
               selectedVideo.attr('title') ||
               '';
    
    // Nếu không có title, extract từ URL
    if (!title && href) {
      const match = href.match(/\/([A-Z]{2,}-?\d{3,})/);
      title = match ? match[1] : 'JAV Video';
    }
    
    title = title || 'Hot JAV Video';
    
    // Lấy ảnh thumbnail
    const imgElement = selectedVideo.find('img').first();
    let image = imgElement.attr('data-src') || 
                imgElement.attr('src') || 
                imgElement.attr('data-original') ||
                imgElement.attr('data-lazy-src');
    
    if (image) {
      if (image.startsWith('//')) {
        image = `https:${image}`;
      } else if (!image.startsWith('http')) {
        image = `https://missav.com${image}`;
      }
    }

    console.log(`🎯 Selected video ${randomIndex + 1}/${allVideos.length}`);
    console.log(`✅ Title: ${title}`);
    console.log(`🔗 URL: ${url}`);
    console.log(`🖼️ Image: ${image || 'No image'}`);
    
    return { 
      title: `🔥 ${title}`,
      url, 
      image 
    };
    
  } catch (err) {
    console.error('❌ Lỗi khi lấy MissAV:', err.message);
    
    // Fallback: thử lấy từ trang chủ
    try {
      console.log('🔄 Thử fallback trang chủ...');
      const res = await fetch('https://missav.com/en');
      const html = await res.text();
      const $ = cheerio.load(html);
      
      const firstLink = $('a[href*="/en/"][href*="-"]').first();
      if (firstLink.length) {
        const href = firstLink.attr('href');
        const url = href.startsWith('http') ? href : `https://missav.com${href}`;
        const img = firstLink.find('img');
        const title = img.attr('alt') || img.attr('title') || 'JAV Video';
        
        return {
          title: `🆘 ${title}`,
          url,
          image: img.attr('data-src') || img.attr('src')
        };
      }
    } catch (fallbackErr) {
      console.error('❌ Fallback cũng lỗi:', fallbackErr.message);
    }
    
    return null;
  }
}

// Hàm gửi embed video
async function sendJAVVideo(channel) {
  const video = await getRandomHotMissAVVideo();
  if (!video || !video.url) {
    console.log('❌ Không có video để gửi');
    return false;
  }

  try {
    const embed = new EmbedBuilder()
      .setTitle(video.title)
      .setURL(video.url)
      .setColor(0xff1493)
      .setDescription('🔥 **Phim HOT ngẫu nhiên từ MissAV** 🔥\n\n🔞 *Chỉ dành cho người trên 18 tuổi*')
      .setFooter({ 
        text: `🎲 Random Hot Video | ${new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}`,
        iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
      })
      .setTimestamp();

    if (video.image) {
      embed.setImage(video.image);
    }

    const message = await channel.send({ embeds: [embed] });
    console.log(`✅ Đã gửi: ${video.title}`);
    console.log(`📨 Message ID: ${message.id}`);
    return true;
  } catch (err) {
    console.error('❌ Lỗi khi gửi embed:', err.message);
    
    // Fallback: gửi tin nhắn text đơn giản
    try {
      const message = await channel.send(`🔥 **${video.title}**\n🔗 ${video.url}\n🔞 Chỉ dành cho 18+ | Random Hot Video`);
      console.log(`✅ Đã gửi (text fallback): ${video.title}`);
      return true;
    } catch (fallbackErr) {
      console.error('❌ Lỗi cả text fallback:', fallbackErr.message);
      return false;
    }
  }
}

// Hàm gửi phim mỗi 5 phút
async function startAutoSending() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) {
      console.error('❌ Không tìm thấy kênh.');
      return;
    }

    console.log(`🤖 Bắt đầu gửi phim HOT random mỗi 5 phút vào kênh: ${channel.name}`);
    
    // Gửi video đầu tiên ngay lập tức
    await sendJAVVideo(channel);
    
    // Thiết lập interval để gửi mỗi 5 phút
    setInterval(async () => {
      console.log('⏰ Đến giờ gửi video tự động...');
      await sendJAVVideo(channel);
    }, 5 * 60 * 1000); // 5 phút
    
  } catch (err) {
    console.error('❌ Lỗi khi thiết lập auto sending:', err.message);
  }
}

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
    console.log('🤖 Bot is ready!');
    console.log(`🔥 Logged in as ${client.user.tag}`);
    
    // Bắt đầu gửi video tự động
    startAutoSending();
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
    
    // Check if the message is #link - gửi video JAV ngay lập tức
    if (message.content === '#link') {
        try {
            console.log(`🎬 ${message.author.tag} yêu cầu link video hot random`);
            await message.reply('🔍 Đang tìm phim hot ngẫu nhiên...');
            
            const success = await sendJAVVideo(message.channel);
            if (!success) {
                await message.channel.send('❌ Không thể lấy video lúc này, vui lòng thử lại sau!');
            }
        } catch (err) {
            console.error('❌ Lỗi khi xử lý lệnh #link:', err.message);
            await message.channel.send('❌ Có lỗi xảy ra, vui lòng thử lại sau!');
        }
    }
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
