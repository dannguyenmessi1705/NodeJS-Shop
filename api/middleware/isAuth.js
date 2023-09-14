const jwt = require("jsonwebtoken");
const genJWT = require("./jwtGeneration");
const invalidToken = []; // Mảng chứa các token không hợp lệ (đã hết hạn hoặc không hợp lệ)
const ProtectRoute = async (req, res, next) => {
  try {
    const header = req.header("Authorization"); // Lấy header Authorization (Bearer token)
    const accessToken = header && header.split(" ")[1]; // Tách và lây token từ "Bearer token"
    if (invalidToken.includes(accessToken)) {
      // Nếu token đã hết hạn hoặc không hợp lệ thì trả về lỗi
      throw new Error("Token Invalid");
    }
    const decoded1 = jwt.verify(accessToken, "nguyendidan"); // Giải mã token
    next();
  } catch (error) {
    const typeError = error.message; // Lấy message của error
    // Nếu accessToken hết hạn => dùng refreshToken để tạo accessToken mới
    if (typeError === "jwt expired") {
      try {
        invalidToken.push(req.session.accessToken); // Thêm accessToken cũ vào mảng invalidToken
        const refreshToken = req.session.refreshToken; // Lấy refreshToken từ session
        const decoded2 = jwt.verify(refreshToken, "nguyendidan"); // Giải mã refreshToken
        const newAccessToken = genJWT.generateAccessToken({
          userId: decoded2.userId,
        }); // Tạo accessToken mới
        const newRefreshToken = genJWT.generateRefreshToken({
          userId: decoded2.userId,
        }); // Tạo refreshToken mới
        req.session.accessToken = newAccessToken; // Gán accessToken mới vào session
        req.session.refreshToken = newRefreshToken; // Gán accessToken mới vào session
        req.session.isLogin = true; // Gán isLogin = true để đánh dấu là đã đăng nhập
        req.session.save(() => {
          // Lưu lại session
          res.status(200).json({
            message: "Done and created new AccessToken",
            accessToken: newAccessToken,
            userId: decoded2.userId,
          }); // Trả về accessToken mới
        }); // Lưu lại session
      } catch (error) {
        req.session.destroy(() => {
          res.status(401).json({ message: "RefreshToken Invalid" }); // Nếu không xác thực được refreshToken thì trả về lỗi
        }); // Xóa session để đăng xuất
      }
    } else {
      // Nếu accessToken không hợp lệ => xóa session và chuyển hướng về trang login
      req.session.destroy(() => {
        res.status(401).json({ message: "AccessToken Invalid" }); // Nếu không xác thực được accessToken thì trả về lỗi
      }); // Xóa session để đăng xuất
    }
  }
};

module.exports = ProtectRoute;
