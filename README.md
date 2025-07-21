# Telegram Trip Bot

Bot quản lý chi tiêu cho chuyến đi, chia tiền công bằng, hỗ trợ WebApp mini, Telegram Bot, Cloudflare Workers, PDF export và mã hóa dữ liệu cá nhân.

## 📦 Tính năng

- Tạo nhóm chuyến đi, thêm thành viên
- Ghi nhận chi tiêu và người hưởng
- Tính toán chia đều hoặc tính phần chi cá nhân
- Mã hóa chuyến đi riêng tư
- Giao diện WebApp mini (PWA)
- Bot Telegram kết nối WebApp
- Export thống kê dưới dạng PDF

## 🏗 Cấu trúc dự án

```
trip-expense-bot/
├── index.html          # Giao diện WebApp
├── style.css           # CSS giao diện
├── main.js             # Logic xử lý WebApp
├── worker.js           # Cloudflare Worker API
├── wrangler.toml       # Cấu hình Cloudflare
├── README.md           # Hướng dẫn sử dụng
```

## 🚀 Triển khai trên Cloudflare Workers

1. Cài đặt Wrangler:
   npm install -g wrangler

2. Cấu hình `wrangler.toml`

3. Đăng nhập & publish:
   wrangler login
   wrangler deploy

## 🧠 API Worker

- POST /trip
- POST /trip/:id/expense
- GET /trip/:id/expenses
- GET /trip/:id/stats

## 🤖 Tích hợp Telegram Bot
## 🔒 Mã hóa chuyến đi riêng tư
## 🧾 Export PDF

✨ Project by @nttung.dev