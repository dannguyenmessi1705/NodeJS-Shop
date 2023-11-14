// {ADDING VALIDATION} // Thêm check validation vào các route cần thiết
const { check } = require("express-validator");

const express = require("express");
const route = express.Router();
const getAuth = require("../controllers/auth");
const User = require("../models/users");
const { verifyCSRFToken } = require("../middleware/csrfToken");
const ProtectRoute = require("../middleware/isAuth");

route.get("/login", getAuth.getAuth);

// {VALIDATION INPUT LOGIN} //
route.post(
  "/login",
  verifyCSRFToken,
  [
    check("email")
      .normalizeEmail()
      .isEmail()
      .withMessage("Please enter the valid email"),
    check("password")
      .trim()
      .notEmpty()
      .withMessage("Please don't leave the blank password"),
  ],
  getAuth.postAuth
);

route.post("/logout", verifyCSRFToken, getAuth.postLogout);

route.get("/signup", getAuth.getSignup);
// {VALIDATION INPUT} //
route.post(
  "/signup",
  verifyCSRFToken,
  [
    // Kiểm tra username đã tồn tại chưa
    check("username")
      .trim()
      .notEmpty()
      .withMessage("Please don't leave the blank username")
      .custom((value, { req }) => {
        // value là giá trị của username, req là request
        return User.findOne({ username: value }).then((usernameFound) => {
          // Tìm kiếm username trong database
          if (usernameFound) {
            // Nếu tìm thấy username
            return Promise.reject(
              // Thì reject và gán vào thuộc tính msg của {validationResult} giá trị bên trong hàm reject(), vì các hàm của moongose trả về promise
              "Username is existed, Please enter the another username"
            );
          }
        });
      }),
    // kiểm tra req.body.email nhập vào có phải là 1 email hợp lệ không
    // -> Nếu không hợp lệ, giá trị bên trong hàm withMessage() sẽ được gán vào thuộc tính msg của {validationResult}
    check("email", "Please enter the valid email")
      .normalizeEmail()
      .notEmpty()
      .isEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((emailFound) => {
          if (emailFound) {
            return Promise.reject(
              "Email is existed, Please sign up with another email"
            );
          }
        });
      }),

    check("password", "The password must be at least 5")
      .trim()
      .isLength({ min: 5 }), // Độ dài mật khẩu tối thiểu là 5

    // Kiểm tra password và re_password có giống nhau không
    check("re_password")
      .trim()
      .custom((value, { req }) => {
        // value là giá trị của re_password, req là request
        if (value !== req.body.password) {
          // Nếu giá trị của re_password khác với giá trị của password
          throw new Error("Password and Re-Password do not match"); // Thì throw error và gán vào thuộc tính msg của {validationResult}
        }
        return true; // Nếu không có lỗi thì return true
      }),
  ],
  getAuth.postSignup
);

// {RESET PASSWORD} //
route.get("/reset", getAuth.getReset);

route.post(
  "/reset",
  verifyCSRFToken,
  // {VALIDATION INPUT} //
  check("email", "Please enter a valid email")
    .normalizeEmail()
    .isEmail()
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then((emailFound) => {
        if (!emailFound) {
          return Promise.reject("Email doesn't exist");
        }
      });
    }),
  getAuth.postReset
);
// {UPDATE PASSWORD} //
route.get("/reset/:tokenReset", getAuth.getUpdatePassword);

route.post(
  "/update-password",
  verifyCSRFToken,
  // {VALIDATION INPUT} //
  check("password", "The password must be at least 5")
    .trim()
    .isLength({ min: 5 }),
  getAuth.postUpdatePassword
);

// GET PROFILE
route.get("/profile", ProtectRoute, getAuth.getProfile);

// UPDATE PROFILE'
route.post(
  "/update-profile",
  ProtectRoute,
  verifyCSRFToken,
  [
    check("password")
      .trim()
      .notEmpty()
      .withMessage("Please don't leave the blank password")
    // Kiểm tra username đã tồn tại chưa
  ],
  getAuth.updateProfile
);

module.exports = route;
