const http = require('http');

// Function to keep the server alive
function keepAlive() {
  // Chỉ chạy keep alive nếu HEALTH_CHECK = true
  if (process.env.HEALTH_CHECK !== 'true') {
    console.log('🔸 Keep alive disabled');
    return;
  }

  // Zeabur URL hoặc localhost cho development
  const zeaburUrl = process.env.ZEABUR_URL || 
                   `http://localhost:${process.env.PORT || 8080}`;
  
  const pingInterval = parseInt(process.env.PING_INTERVAL) || 300000; // 5 phút default
  
  console.log(`🔄 Keep alive started - URL: ${zeaburUrl}`);
  console.log(`⏰ Ping interval: ${pingInterval/1000} seconds`);
  
  setInterval(() => {
    http.get(zeaburUrl, (res) => {
      console.log(`✅ Keep alive ping: ${res.statusCode} at ${new Date().toLocaleTimeString()}`);
    }).on('error', (err) => {
      console.log(`❌ Keep alive error: ${err.message}`);
    });
  }, pingInterval);
}

module.exports = keepAlive;
