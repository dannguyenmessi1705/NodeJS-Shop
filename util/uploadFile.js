// {MULTER} // (Để lấy dữ liệu file từ form) //
const multer = require("multer"); // Nhập module multer
exports.fileStorage = multer.diskStorage({
  // Tạo 1 storage để lưu file
  destination(req, file, callback) {
    // Định nghĩa đường dẫn lưu file
    if (req.originalUrl.includes("profile") && req.session?.user) {
        callback(null, "images/avatar"); // Lưu file vào folder images
    } else {
      callback(null, "images"); // Lưu file vào folder images
    }
  },
  filename(req, file, callback) {
    // Định nghĩa tên file
    let userId;
    let formattedDate;
    if (req.originalUrl.includes("profile") && req.session?.user) {
      userId = req.session.user._id;
      formattedDate = "";
      callback(null, userId + "." + file.originalname.split(".")[1]); 
    } else {
      userId = "";
      const date = new Date(); // Lấy ngày giờ hiện tại
      const formattedDate = date
        .toISOString()
        .replace(/:/g, "_")
        .replace(/\./g, ""); // Định dạng ngày giờ hiện tại (phải chuyển đổi sang dạng string mới đúng cú pháp đặt tên file)
      callback(null, formattedDate + file.originalname); // Đặt tên file = ngày giờ hiện tại + tên file gốc
    }
  },
});

exports.fileFilter = (req, file, callback) => {
  // Định nghĩa loại file được phép upload
  if (
    // Nếu file là 1 trong các loại này thì cho phép upload
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    callback(null, true); // true => cho phép upload
  } else {
    callback(null, false); // false => không cho phép upload
  }
};
