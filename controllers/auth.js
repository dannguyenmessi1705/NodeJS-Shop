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
const rootPath = require("../util/path"); // Nhập đường dẫn tuyệt đối của thư mục gốc
const path = require("path"); // Nhập module path

const User = require("../models/users");
const bcrypt = require("bcrypt");
// {SESSION + COOKIES} // Đối với Session, phải tạo Session trước khi tạo Cookie
const postAuth = (req, res, next) => {
  const email = req.body.email; // Lấy giá trị email từ form
  const password = req.body.password; // Lấy giá trị password từ form
  User.findOne({ email: email }) // Tìm user có email = email
    .then((user) => {
      if (!user) {
        // Nếu không tìm thấy user
        // {FLASH MESSAGE} // Nếu password không trùng khớp
        req.flash("errorLogin", "Email or Password does not match!"); // Tạo flash message có tên là "error", giá trị là "Email or Password does not match!"
        return res.redirect("/login"); // Chuyển hướng về trang login
      }
      bcrypt
        .compare(password, user.password) // So sánh password nhập vào với password đã mã hoá trong database
        .then((isMatch) => {
          if (isMatch) {
            // {FLASH MESSAGE} //
            req.flash("successLogin", "Login successfully!"); // Tạo flash message có tên là "success", giá trị là "Login successfully!"
            // Nếu password trùng khớp
            req.session.isLogin = true; // Tạo Session có tên là "isLogin", giá trị là "true"
            req.session.user = user; // Tạo Session có tên là "user", giá trị là user vừa tìm được
            // req.session.cookie.maxAge = 3000; // Thời gian tồn tại của Session là 3s
            return req.session.save(() => {
              // Lưu Session
              res.redirect("/"); // Sau khi lưu Session thì mới chuyển hướng sang trang chủ (vì lưu Session là bất đồng bộ)
            });
          } else {
            // {FLASH MESSAGE} // Nếu password không trùng khớp
            req.flash("errorLogin", "Email or Password does not match!"); // Tạo flash message có tên là "error", giá trị là "Email or Password does not match!"
            return res.redirect("/login"); // Chuyển hướng về trang login
          }
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
};

const getAuth = (req, res, next) => {
  const [errorMessage] = req.flash("errorLogin"); // Lấy giá trị flash message có tên là "error"
  const [successSignup] = req.flash("successSignup"); // Lấy giá trị flash message có tên là "successSigup"
  const [updatePassword] = req.flash("updatePassword");
  res.render("./auth/login", {
    title: "Login",
    path: "/login",
    successSignup: successSignup, // Truyền giá trị flash message có tên là "success" vào biến successSigup
    errorMessage: errorMessage, // Truyền giá trị flash message có tên là "error" vào biến errorMessage
    updatePassword: updatePassword,
  });
};

// LOGOUT => SESSION SẼ XOÁ
const postLogout = (req, res, next) => {
  req.session.destroy(() => {
    // Xoá Session
    res.redirect("/"); // Sau khi xoá Session thì mới chuyển hướng sang trang chủ (vì xoá Session là bất đồng bộ)
  });
};

// SIGNUP
const postSignup = (req, res, next) => {
  const username = req.body.username; // Lấy giá trị username từ form
  const email = req.body.email; // Lấy giá trị email từ form
  const password = req.body.password; // Lấy giá trị password từ form
  const re_password = req.body.re_password; // Lấy giá trị re_password từ form
  if (username && email && password && re_password) {
    // Nếu tất cả các giá trị đều tồn tại
    return User.findOne({ username: username }) // Tìm kiếm 1 user trong collection có username là username
      .then((name) => {
        if (name) {
          // Nếu tìm thấy => username đã tồn tại
          // {FLASH MESSAGE} // Nếu username đã tồn tại
          req.flash("errorUsername", "Username is existed"); // Tạo flash message có tên là "error", giá trị là "Username is existed"
          return res.redirect("/signup"); // Chuyển hướng sang trang đăng ký
        }
        User.findOne({ email: email }) // Tìm kiếm 1 user trong collection có email là email
          .then((userEmail) => {
            if (userEmail) {
              // Nếu tìm thấy => email đã tồn tại
              // {FLASH MESSAGE} // Nếu email đã tồn tại
              req.flash("errorEmail", "Email is existed"); // Tạo flash message có tên là "error", giá trị là "Email is existed"
              return res.redirect("/signup"); // Chuyển hướng sang trang đăng ký
            } else if (password !== re_password) {
              // Nếu password và re_password không trùng khớp
              // {FLASH MESSAGE} // Nếu password không trùng khớp
              req.flash(
                "errorRePassword",
                "Password and Re-Password does not match"
              ); // Tạo flash message có tên là "error", giá trị là "Password does not match"
              return res.redirect("/signup"); // Chuyển hướng sang trang đăng ký
            }
            bcrypt
              .hash(password, 12) // Nếu không tìm thấy => Mã hóa password với số lần lặp là 12
              .then((hashPassword) => {
                const user = new User({
                  // Tạo 1 user mới
                  username: username,
                  email: email,
                  password: hashPassword,
                  cart: {
                    items: [],
                  },
                });
                return user.save().then(() => {
                  // {FLASH MESSAGE} // Nếu user mới tạo thành công
                  req.flash("successSignup", "Sign up successfully"); // Tạo flash message có tên là "success", giá trị là "Sign up successfully"
                  // Lưu user mới tạo
                  res.redirect("/login"); // Chuyển hướng sang trang đăng nhập

                  // {SEND MAIL} //
                  const pathImg = path.join(
                    rootPath,
                    "public",
                    "img",
                    "signup.png"
                  ); // Đường dẫn đến file hình ảnh
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
                    .then((res) => console.log(res)) // Nếu gửi mail thành công
                    .catch((err) => console.log(err)); // Nếu gửi mail thất bại
                });
              });
          });
      })
      .catch((err) => console.log(err));
  }
  return res.redirect("/signup");
};

// {SIGNUP} //
const getSignup = (req, res, next) => {
  const [errorUsername] = req.flash("errorUsername"); // Lấy giá trị flash message có tên là "errorUsername"
  const [errorEmail] = req.flash("errorEmail"); // Lấy giá trị flash message có tên là "errorEmail"
  const [errorRePassword] = req.flash("errorRePassword"); // Lấy giá trị flash message có tên là "errorRePassword"
  res.render("./auth/signup", {
    title: "SignUp",
    path: "/signup",
    errorUsername: errorUsername,
    errorEmail: errorEmail,
    errorRePassword: errorRePassword,
  });
};

// {RESET PASSWORD} //
const postReset = (req, res, next) => {
  const email = req.body.email; // Lấy giá trị email từ form
  User.findOne({ email: email }) // Tìm kiếm 1 user trong collection có email là email
    .then((user) => {
      // Nếu không tìm thấy => email không tồn tại
      if (!user) {
        req.flash("errorEmail", "No account with that email found"); // Tạo flash message có tên là "error", giá trị là "No account with that email found"
        return res.redirect("/reset"); // Chuyển hướng sang trang reset password
      }
      // Nếu tìm thấy => email tồn tại
      crypto.randomBytes(32, (err, buffer) => {
        // Tạo 1 chuỗi ngẫu nhiên có độ dài là 32
        if (err) {
          // Nếu có lỗi
          console.log(err); // In ra lỗi
          return res.redirect("/reset"); // Chuyển hướng sang trang reset password
        }
        // Nếu không có lỗi
        const token = buffer.toString("hex"); // Chuyển buffer thành chuỗi hex
        user.resetPasswordToken = token; // Lưu token vào user
        user.resetPasswordExpires = Date.now() + 600000; // Lưu thời gian hết hạn của token vào user (10 phút)
        return user // Lưu user
          .save()
          .then(() => {
            const data = {
              from: "didannguyen@5dulieu.com", // Địa chỉ email của người gửi
              to: email, // Địa chỉ email của người nhận
              subject: "Reset Password", // Tiêu đề mail
              html: `<h2>Click this <a href="http://https://shop-9h0m.onrender.com/reset/${token}">link</a> to reset your password</h2>`, // Nội dung mail
            }; // Tạo 1 mail
            transporter
              .sendMail(data) // Gửi mail
              .then((res) => {
                console.log(res);
              })
              .catch((err) => console.log(err));
          })
          .catch((err) => console.log(err));
      });
      req.flash("requestSuccess", "Request Success"); // Tạo flash message có tên là "requestSuccess", giá trị là "Request Success"
      return res.redirect("/reset"); // Chuyển hướng sang trang reset password
    })
    .catch((err) => console.log(err));
};

const getReset = (req, res, next) => {
  const [errorEmail] = req.flash("errorEmail"); // Lấy giá trị flash message có tên là "errorEmail"
  const [requestSuccess] = req.flash("requestSuccess"); // Lấy giá trị flash message có tên là "requestSuccess"
  res.render("./auth/reset", {
    path: "/reset",
    title: "Reset Password",
    errorEmail: errorEmail,
    requestSuccess: requestSuccess,
  });
};

// {UPDATE PASSWORD} //
const getUpdatePassword = (req, res, next) => {
  const token = req.params.tokenReset;
  User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  })
    .then((user) => {
      res.render("./auth/updatePassword", {
        path: "/update-password",
        title: "Update Password",
        passwordToken: token,
        userId: user._id.toString(),
      });
    })
    .catch((err) => console.log(err));
};
const postUpdatePassword = (req, res, next) => {
  const ID = req.body.userId;
  const token = req.body.passwordToken;
  let resetUser;
  User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
    _id: ID,
  })
    .then((user) => {
      const password = req.body.password;
      resetUser = user;
      return bcrypt.hash(password, 12);
    })
    .then((hashPassword) => {
      resetUser.password = hashPassword;
      resetUser.resetPasswordToken = null;
      resetUser.resetPasswordExpires = null;
      return resetUser.save();
    })
    .then(() => {
      req.flash(
        "updatePassword",
        "You change your password successully, Please login"
      );
      res.redirect("/login");
    })
    .catch((err) => console.log(err));
};
module.exports = {
  getAuth,
  postAuth,
  postLogout,
  getSignup,
  postSignup,
  getReset,
  postReset,
  getUpdatePassword,
  postUpdatePassword,
};
