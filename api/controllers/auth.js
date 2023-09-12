// {ADDING VALIDATION} // Nhập module validationResult dùng để xác thực dữ liệu đầu vào
const { validationResult } = require("express-validator");

// Tạo 1 bit random ngẫu nhiên => phục vụ cho việc tạo token
const crypto = require("crypto");
// {SENDING EMAIL AFTER SIGNUP} //
const nodemailer = require("nodemailer"); // Nhập module nodemailer
// Tạo transporter để gửi mail
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Host của mail server
  port: 465, // Port của mail server
  secure: true, // Sử dụng SSL
  auth: {
    user: "didannguyen@5dulieu.com", // mail dùng để gửi
    pass: "femryegbpgljleyv", // password của mail dùng để gửi (có thể dùng password ứng dụng) (https://myaccount.google.com/apppasswords) thay vì dùng password của mail
  },
});
const fs = require("fs"); // Nhập module fs
const rootPath = require("../../util/path"); // Nhập đường dẫn tuyệt đối của thư mục gốc
const path = require("path"); // Nhập module path

const User = require("../../models/users");
const bcrypt = require("bcrypt");

// LOGIN
// {SESSION + COOKIES} // Đối với Session, phải tạo Session trước khi tạo Cookie
const postAuth = async (req, res, next) => {
  const email = req.body.email; // Lấy giá trị email từ form
  const password = req.body.password; // Lấy giá trị password từ form
  // {VALIDATION INPUT} //
  const errorValidation = validationResult(req);
  try {
    if (!errorValidation.isEmpty()) {
      const [error] = errorValidation.array();
      return res.status(422).json({
        message: error.msg,
        title: "Login",
        path: "/login",
        hasFooter: false,
        errorType: error.path, // Lưu lại lỗi thuộc trường nào
        oldInput: {
          email,
          password,
        }, // Lưu lại các giá trị vừa nhập
      });
    }
    const user = await User.findOne({ email: email }); // Tìm user có email = email
    if (!user) {
      return res.status(404).json({ message: "Email does not exist!" });
    }
    const checkPass = await bcrypt.compare(password, user.password); // So sánh password nhập vào với password đã mã hoá trong database
    if (checkPass) {
      // Nếu password trùng khớp
      req.session.isLogin = true; // Tạo Session có tên là "isLogin", giá trị là "true"
      req.session.user = user; // Tạo Session có tên là "user", giá trị là user vừa tìm được
      // req.session.cookie.maxAge = 3000; // Thời gian tồn tại của Session là 3s
      await req.session.save(); // Lưu Session
      res
        .status(200)
        .json({ message: "Login successfully", userId: user._id.toString() });
    } else {
      res.status(401).json({ message: "Email or Password is incorrect!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// LOGOUT => SESSION SẼ XOÁ
const postLogout = async (req, res, next) => {
  try {
    await req.session.destroy(); // Xoá Session
    res.status(200).json({ message: "Logout successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// SIGNUP
const postSignup = async (req, res, next) => {
  const username = req.body.username; // Lấy giá trị username từ form
  const email = req.body.email; // Lấy giá trị email từ form
  const password = req.body.password; // Lấy giá trị password từ form
  const re_password = req.body.re_password; // Lấy giá trị re_password từ form
  // {Thêm phần nhập request vào hàm validationResult để kiểm tra với hàm check bên routes/auth} //
  const errorValidation = validationResult(req);
  // Nếu tồn tại lỗi trong việc xác thực giá trị nhập vào (email không hợp lệ, pass ko đủ độ dài và không == vs rePass)
  // {VALIDATION} //
  try {
    if (!errorValidation.isEmpty()) {
      const [error] = errorValidation.array(); // Lấy phần tử đầu tiên của mảng
      return res.status(422).json({
        message: error.msg,
        title: "Sign Up",
        path: "/signup",
        hasFooter: false,
        errorType: error.path, // xác định trường nào  lõi cần sửa
        oldInput: { username, email, password, re_password }, // Lưu lại các giá trị vừa nhập
      });
    }
    // Nếu tất cả đều OK
    // {HASH PASSWORD} //
    const hashPassword = bcrypt.hashSync(password, 12); // Mã hóa password với số lần lặp là 12
    const user = new User({
      // Tạo 1 user mới
      username: username,
      email: email,
      password: hashPassword,
      cart: {
        items: [],
      },
    });
    await user.save();
    // {SEND MAIL} //
    const pathImg = path.join(rootPath, "public", "img", "signup.png"); // Đường dẫn đến file hình ảnh
    // Dùng transporter vừa tạo để gửi mail
    transporter
      .sendMail({
        // Tạo 1 mail
        from: "didannguyen@5dulieu.com", // Địa chỉ email của người gửi
        to: email, // Địa chỉ email của người nhận
        subject: "Signup Successfully", // Tiêu đề mail
        html: `<h1>You signup successfully. Welcome to our service</h1>`, // Nội dung mail
        attachments: [
          // File đính kèm
          {
            filename: "signup.png", // Tên file đính kèm
            content: fs.createReadStream(pathImg), // Nội dung file đính kèm
          },
        ],
      })
      .then((res) =>
        res.status(201).json({ message: "Signup successfully", email: res })
      ); // Nếu gửi mail thành công
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// {RESET PASSWORD} //
const postReset = async (req, res, next) => {
  const email = req.body.email; // Lấy giá trị email từ form
  // {VALIDATION INPUT} + CHECK EMAIL EXIST ?
  const errorValidation = validationResult(req);
  try {
    if (!errorValidation.isEmpty()) {
      const [error] = errorValidation.array();
      return res.status(422).json({
        message: error.msg,
        path: "/reset",
        title: "Reset Password",
        requestSuccess: undefined,
        errorType: error.path,
        oldInput: email,
        hasFooter: false,
      });
    } else {
      const user = await User.findOne({ email: email }); // Tìm kiếm 1 user trong collection có email là email
      if (!user) {
        // Nếu không tìm thấy
        return res.status(404).json({ message: "Email does not exist!" }); // Trả về lỗi
      }
      // Nếu tìm thấy => email tồn tại
      crypto.randomBytes(32, async (err, buffer) => {
        // Tạo 1 chuỗi ngẫu nhiên có độ dài là 32
        if (err) {
          return res.status(500).json({ message: "Server error" }); // Trả về lỗi
        }
        // Nếu không có lỗi
        const token = buffer.toString("hex"); // Chuyển buffer thành chuỗi hex
        user.resetPasswordToken = token; // Lưu token vào user
        user.resetPasswordExpires = Date.now() + 600000; // Lưu thời gian hết hạn của token vào user (10 phút)
        const http = req.protocol + "://" + req.get("host"); // Lấy đường dẫn trang mặc định (http://localhost:3000/)
        await user.save(); // Lưu user
        const data = {
          from: "didannguyen@5dulieu.com", // Địa chỉ email của người gửi
          to: email, // Địa chỉ email của người nhận
          subject: "Reset Password", // Tiêu đề mail
          html: `<h2>Click this <a href="${http}/reset/${token}">link</a> to reset your password</h2>`, // Nội dung mail
        }; // Tạo 1 mail
        transporter
          .sendMail(data) // Gửi mail
          .then((res) => {
            res
              .status(201)
              .json({ message: "Reset password successfully", email: res }); // Trả về thành công
          });
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const postUpdatePassword = (req, res, next) => {
  const ID = req.body.userId; // Lấy giá trị userId từ form
  const token = req.body.passwordToken; // Lấy giá trị passwordToken từ form
  const password = req.body.password; // Lấy giá trị password từ form
  let resetUser; // Khai báo 1 biến để lưu user
  const errorValidation = validationResult(req);
  if (!errorValidation.isEmpty()) {
    console.log(errorValidation.array());
    const [error] = errorValidation.array();
    return User.findOne({
      resetPasswordToken: token, // Tìm kiếm 1 user trong collection có resetPasswordToken là token
      resetPasswordExpires: { $gt: Date.now() }, // Và resetPasswordExpires > Date.now()
    })
      .then((user) => {
        // Nếu tìm thấy
        return res.status(422).render("./auth/updatePassword", {
          path: "/update-password",
          hasFooter: false,
          title: "Update Password",
          passwordToken: token,
          userId: user._id.toString(),
          error: error.msg,
          errorType: error.path,
          oldInput: password,
        });
      })
      .catch((err) => {
        // {ERROR MIDDLEWARE} //
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
      });
  }
  User.findOne({
    resetPasswordToken: token, // Tìm kiếm 1 user trong collection có resetPasswordToken là token
    resetPasswordExpires: { $gt: Date.now() }, // Và resetPasswordExpires > Date.now()
    _id: ID, // Và _id = ID
  })
    .then((user) => {
      // Nếu tìm thấy
      resetUser = user; // Lưu user vào biến resetUser
      return bcrypt.hash(password, 12); // Hash password
    })
    .then((hashPassword) => {
      resetUser.password = hashPassword; // Lưu password đã hash vào user
      resetUser.resetPasswordToken = null; // Xóa resetPasswordToken
      resetUser.resetPasswordExpires = null; // Xóa resetPasswordExpires
      return resetUser.save();
    })
    .then(() => {
      req.flash(
        "updatePassword",
        "You change your password successully, Please login"
      );
      res.redirect("/login");
    })
};
module.exports = {
  postAuth,
  postLogout,
  postSignup,
  postReset,
  postUpdatePassword,
};
