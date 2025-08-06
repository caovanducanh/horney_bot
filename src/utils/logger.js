/**
 * Logging utility with emojis and colors
 */

class Logger {
    static info(message, data = null) {
        const timestamp = new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'});
        console.log(`ℹ️  [${timestamp}] ${message}`);
        if (data) console.log(data);
    }
    
    static success(message, data = null) {
        const timestamp = new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'});
        console.log(`✅ [${timestamp}] ${message}`);
        if (data) console.log(data);
    }
    
    static error(message, error = null) {
        const timestamp = new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'});
        console.error(`❌ [${timestamp}] ${message}`);
        if (error) console.error(error);
    }
    
    static warning(message, data = null) {
        const timestamp = new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'});
        console.warn(`⚠️  [${timestamp}] ${message}`);
        if (data) console.warn(data);
    }
    
    static debug(message, data = null) {
        const timestamp = new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'});
        console.log(`🐛 [${timestamp}] ${message}`);
        if (data) console.log(data);
    }
    
    static bot(message, data = null) {
        const timestamp = new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'});
        console.log(`🤖 [${timestamp}] ${message}`);
        if (data) console.log(data);
    }
    
    static video(message, data = null) {
        const timestamp = new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'});
        console.log(`🎬 [${timestamp}] ${message}`);
        if (data) console.log(data);
    }
    
    static search(message, data = null) {
        const timestamp = new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'});
        console.log(`🔍 [${timestamp}] ${message}`);
        if (data) console.log(data);
    }
    
    static fire(message, data = null) {
        const timestamp = new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'});
        console.log(`🔥 [${timestamp}] ${message}`);
        if (data) console.log(data);
    }
    
    static clock(message, data = null) {
        const timestamp = new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'});
        console.log(`⏰ [${timestamp}] ${message}`);
        if (data) console.log(data);
    }
}

module.exports = Logger;
