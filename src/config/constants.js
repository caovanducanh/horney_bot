/**
 * Bot Configuration Constants
 */

const CONFIG = {
    // Discord
    CHANNEL_ID: '1402562738974363652',  // Original channel ID that was working
    
    // Timing
    AUTO_SEND_INTERVAL: 5 * 60 * 1000, // 5 minutes in milliseconds
    REQUEST_TIMEOUT: 15000, // 15 seconds
    
    // MissAV URLs - Try multiple domains and paths
    MISSAV_URLS: [
        'https://missav.com/en',               // Original domain
        'https://missav.com/en/hot',           // Hot section
        'https://missav.com/en/new',           // New releases
        'https://missav.com/en/uncensored',    // Uncensored
        'https://missav.ws/dm18/vi',           // Alternative domain
        'https://missav.ws/vi/new',            // Recent update
        'https://missav.ws/vi/release',        // New releases
        'https://www.missav.com/en'            // With www
    ],
    
    // Selectors for video elements (updated based on actual HTML structure)
    VIDEO_SELECTORS: [
        'a[href*="/vi/"][href*="-"]',          // Main pattern for videos
        'a[href*="/dm18/vi/"][href*="-"]',     // DM18 videos
        'a[href*="/dm13/vi/"][href*="-"]',     // DM13 videos
        'a[href*="fc2-ppv-"]',                 // FC2 videos
        '.card a[href*="/vi/"]',               // Card containers
        '.group a[href*="/vi/"]',              // Group containers
        '.movie-box a',                        // Movie boxes
        '.thumbnail',                          // Thumbnail links
        '.item a[href*="/vi/"]',               // Item containers
        '.col a[href*="/vi/"]',                // Column containers
        'a[href*="missav.ws"][href*="-"]'      // Any missav link with code
    ],
    
    // Request headers - Improved to bypass detection
    HEADERS: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8,ja;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://google.com/',
        'Origin': 'https://google.com'
    },
    
    // Discord embed colors
    COLORS: {
        PRIMARY: 0xff1493,      // Deep Pink
        SUCCESS: 0x00ff00,      // Green
        ERROR: 0xff0000,        // Red
        WARNING: 0xffa500       // Orange
    },
    
    // Messages
    MESSAGES: {
        SEARCHING: '🔍 Đang tìm phim hot ngẫu nhiên...',
        SUCCESS: '✅ Đã gửi',
        ERROR: '❌ Không thể lấy video lúc này, vui lòng thử lại sau!',
        NO_VIDEO: '❌ Không có video để gửi',
        FALLBACK_ERROR: '❌ Có lỗi xảy ra, vui lòng thử lại sau!'
    }
};

module.exports = CONFIG;
