const jwt = require("jsonwebtoken");
const genJWT = require("./jwtGeneration");
const ProtectRoute = async (req, res, next) => {
  try {
    let accessToken = req.session.accessToken; // Lấy token từ session
    const decoded1 = jwt.verify(accessToken, "nguyendidan"); // Giải mã token
    next();
  } catch (error) {
    const typeError = error.message; // Lấy message của error
    // Nếu accessToken hết hạn => dùng refreshToken để tạo accessToken mới
    if (typeError === "jwt expired") {
      try {
        let refreshToken = req.session.refreshToken; // Lấy refreshToken từ session
        console.log(refreshToken)
        const decoded2 = jwt.verify(refreshToken, "nguyendidan"); // Giải mã refreshToken
        const newAccessToken = genJWT.generateAccessToken({userId: decoded2.userId}); // Tạo accessToken mới
        req.session.accessToken = newAccessToken; // Gán accessToken mới vào session
        req.session.isLogin = true; // Gán isLogin = true để đánh dấu là đã đăng nhập
        req.session.save(() => { // Lưu lại session
          console.log("New accessToken generated");
          next(); // Chuyển hướng tiếp tục đến route
        }); // Lưu lại session
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
