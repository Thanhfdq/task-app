import dotenv from 'dotenv';
dotenv.config();

module.exports = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Đặt thành true nếu dùng HTTPS
    maxAge: 1000 * 60 * 60 // 1 giờ
  }
};
