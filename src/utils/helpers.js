/**
 * Clean Bot Utilities
 */

/**
 * Delay function để tránh spam
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate URL
 */
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Generate random user agent
 */
function getRandomUserAgent() {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
    ];
    
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Log với timestamp
 */
function logWithTime(message, level = 'INFO') {
    const timestamp = new Date().toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',  
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const levelEmoji = {
        'INFO': 'ℹ️',
        'SUCCESS': '✅',
        'ERROR': '❌',
        'WARNING': '⚠️',
        'DEBUG': '🔍'
    };
    
    console.log(`[${timestamp}] ${levelEmoji[level] || 'ℹ️'} ${message}`);
}

/**
 * Retry function với exponential backoff
 */
async function retry(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            
            const waitTime = delay * Math.pow(2, i);
            logWithTime(`Retry ${i + 1}/${maxRetries} after ${waitTime}ms...`, 'WARNING');
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}

module.exports = {
    delay,
    isValidUrl,
    getRandomUserAgent,
    logWithTime,
    retry
};
