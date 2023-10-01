const jwt = require("jsonwebtoken");
const secret = process.env.SECRET_KEY_JWT; // Chuỗi bí mật để mã hoá token
// Tạo accessToken, payload là thông tin của user (lấy id của user để tạo token)
const generateAccessToken = (payload) => {
  try {
    const accessToken = jwt.sign(payload, secret, { expiresIn: "10m" }); // expiresIn: '10m' - thời gian sống của token là 10 phút, sau 10 phút token sẽ hết hạn, dùng để xác thực người dùng
    return accessToken;
  } catch (error) {
    console.log(error);
  }
};

// Tạo refreshToken, payload là thông tin của user (lấy id của user để tạo token)
const generateRefreshToken = (payload) => {
  try {
    const refreshToken = jwt.sign(payload, secret, { expiresIn: "3d" }); // expiresIn: '7d' - thời gian sống của token là 7 ngày, sau 7 ngày token sẽ hết hạn, dùng để tạo ra accesstoken khi hết hạn
    return refreshToken;
  } catch (error) {
    console.log(error);
  }
};

module.exports = { generateAccessToken, generateRefreshToken };
