// {CSRF khai báo sau khi định nghĩa SESSION} //
const Tokens = require("csrf"); // Nhập module csrf
const csrf = new Tokens(); // Tạo 1 object csrf
const csrfProtectSecret = csrf.secretSync(); // Tạo 1 secret để mã hoá token
// {MIDDLEWARE ĐỂ TRUYỀN BIẾN LOCALS CHO TẤT CẢ CÁC ROUTE} //
const CreateCSRFTOKEN = (req, res, next) => {
  req.token = csrf.create(csrfProtectSecret); // Tạo 1 token
  res.locals.authenticate = req.session.isLogin; // Truyền biến authenticate vào locals để sử dụng ở tất cả các route
  res.locals.csrfToken = req.token; // Truyền biến csrfToken vào locals để sử dụng ở tất cả các route
  next();
}; // Sử dụng middleware bảo vệ các route, nếu không có token thì các lệnh request sẽ báo lỗi

const verifyCSRFToken = (req, res, next) => {
  const token = req.get('X-CSRF-Token'); // Lấy token từ form, nếu dùng API thì lấy từ header X-CSRF-Token
  if (!csrf.verify(csrfProtectSecret, token)) {
    // Nếu token không trùng với token được tạo ra từ secret
    const err = new Error("Invalid CSRF Token"); // Tạo 1 error
    err.httpStatusCode = 403; // Gán httpStatusCode cho error
    return next(err); // Trả về error
  }
  next();
};

module.exports = {
  CreateCSRFTOKEN,
  verifyCSRFToken,
};
