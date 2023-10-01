const jwt = require("jsonwebtoken");
const genJWT = require("./jwtGeneration");
const invalidToken = [] // Mảng chứa các token không hợp lệ (đã hết hạn hoặc không hợp lệ)
const ProtectRoute = async (req, res, next) => {
  try {
    let accessToken =
      req.session.accessToken || req.get("Authorization").split(" ")[1]; // Lấy token từ session
    if (invalidToken.includes(accessToken)) { // Nếu token đã hết hạn hoặc không hợp lệ thì trả về lỗi
      throw new Error("Token Invalid");
    }
    const decoded1 = jwt.verify(accessToken, process.env.SECRET_KEY_JWT); // Giải mã token
    next();
  } catch (error) {
    const typeError = error.message; // Lấy message của error
    // Nếu accessToken hết hạn => dùng refreshToken để tạo accessToken mới
    if (typeError === "jwt expired") {
      try {
        invalidToken.push(req.session.accessToken) // Thêm accessToken cũ vào mảng invalidToken
        let refreshToken = req.session.refreshToken; // Lấy refreshToken từ session
        const decoded2 = jwt.verify(refreshToken, process.env.SECRET_KEY_JWT); // Giải mã refreshToken
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
          console.log("New accessToken generated");
          return;
        }); // Lưu lại session
        next(); // Chuyển hướng tiếp tục đến route
      } catch (error) {
        req.session.destroy(() => {
          console.log("RefreshToken Invalid");
          res.redirect("/login"); // Nếu không có token thì chuyển hướng về trang login
        }); // Xóa session để đăng xuất
      }
    } else {
      // Nếu accessToken không hợp lệ => xóa session và chuyển hướng về trang login
      req.session.destroy(() => {
        console.log("AccessToken Invalid");
        res.redirect("/login"); // Nếu không có token thì chuyển hướng về trang login
      }); // Xóa session để đăng xuất
    }
  }
};

module.exports = ProtectRoute;
