# Horney Bot Discord 🤖

Bot Discord gửi link phim JAV từ MissAV với tính năng tự động và theo yêu cầu.

## ✨ Tính năng

### 🔄 Tự động gửi phim
- Gửi link phim JAV mới nhất mỗi **5 phút** vào channel được chỉ định
- Kèm theo ảnh thumbnail và thông tin phim
- Sử dụng Discord Embed với màu sắc đẹp mắt

### 🎯 Lệnh thủ công
- `#link` - Gửi link phim ngay lập tức (không cần đợi 5 phút)
- `#ping` - Kiểm tra độ trễ của bot

## 🛠️ Cấu hình

### Channel ID
```javascript
const CHANNEL_ID = '1402294476424089781'; // ID channel của bạn
```

### Thời gian gửi tự động
```javascript
setInterval(async () => {
  await sendJAVVideo(channel);
}, 5 * 60 * 1000); // 5 phút = 300,000ms
```

## 📦 Dependencies

- `discord.js` - Thư viện Discord
- `node-fetch@2` - Để fetch dữ liệu từ web
- `cheerio` - Để parse HTML
- `express` - Web server cho keep-alive
- `dotenv` - Quản lý biến môi trường