const express = require("express");
const app = express();

/* FOR COOKIES ONLY 
// {SET COOKIE FOR EXPRESS} //
const cookies = require("cookie-parser"); // q
app.use(cookies("secret")); // Truyền "secret" để dùng các lệnh mã hoá Cookie
*/

// {DÙNG MONGODB ĐỂ LƯU TRỮ SESSION} //
const session = require("express-session"); // Nhập module express-session
const URL = require("./util/database"); // Nhập vào object lấy URL connect MONGO từ file database.js
const MongoDBStore = require("connect-mongodb-session")(session); // Nhập module connect-mongodb-session để lưu session vào database
const storeDB = new MongoDBStore({
  // Tạo 1 store để lưu session vào database
  uri: URL, // Đường dẫn kết nối đến database
  collection: "sessions", // Tên collection để lưu session
});

// {SET SESSION + COOKIES FOR EXPRESS} //
// Cấu hình session
app.use(
  session({
    secret: "Nguyen Di Dan", // Chuỗi bí mật để mã hoá session
    resave: false, // resave: false => Không lưu lại session nếu không có sự thay đổi (Không cần thiết)
    saveUninitialized: false, // saveUninitialized: false => Không lưu lại session nếu không có sự thay đổi (Không cần thiết)
    // resave vs saveUninitialized: https://stackoverflow.com/questions/40381401/when-use-saveuninitialized-and-resave-in-express-session
    store: storeDB, // Lưu session vào database
    // Ngoài ra có thể tuỳ chỉnh thêm cho cookie: secure, path, signed,... ở cấu hình session
    cookie: {
      signed: true,
    },
  })
);

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

// {FLASH MESSAGE} //
const flash = require("connect-flash");
app.use(flash());

app.set("view engine", "ejs");
app.set("views", "./views");

// {RUN SERVER + Add user to req (Phân quyền)} //
const mongoose = require("mongoose"); // Nhập module mongoose
const User = require("./models/users"); // Nhập vào class User lấy từ file users.js
mongoose
  .connect(URL)
  .then(() => {
    app.listen(3000);
    console.log("Connected!");
  }) // Kết nối với database, sau đó mới chạy server
  .catch((err) => {
    console.log(err);
    res.redirect("/500-maintenance");
  });

// {CSRF khai báo sau khi định nghĩa SESSION} //
const Tokens = require("csrf"); // Nhập module csrf
const csrf = new Tokens(); // Tạo 1 object csrf
const csrfProtectSecret = csrf.secretSync(); // Tạo 1 secret để mã hoá token
// {MIDDLEWARE ĐỂ TRUYỀN BIẾN LOCALS CHO TẤT CẢ CÁC ROUTE} //
app.use((req, res, next) => {
  const token = csrf.create(csrfProtectSecret); // Tạo 1 token
  res.locals.authenticate = req.session.isLogin; // Truyền biến authenticate vào locals để sử dụng ở tất cả các route
  res.locals.csrfToken = token; // Truyền biến csrfToken vào locals để sử dụng ở tất cả các route
  next();
}); // Sử dụng middleware bảo vệ các route, nếu không có token thì các lệnh request sẽ báo lỗi

// {MIDDLEWARE PHÂN QUYỀN DÙNG SESSION} //
app.use((req, res, next) => {
  if (!req.session?.user) {
    // Nếu không có session user thì return next() để chạy các middleware tiếp theo mà không có phân quyền
    return next();
  }
  User.findById(req.session.user._id) // Tìm kiếm user trong collection users có id trùng với id của session user
    .then((user) => {
      // Nếu ko tìm thấy user => chuyển hướng mà không có phân quyền
      if (!user) {
        next();
      }
      // Nếu tìm thấy user thì lưu vào req.user
      req.user = new User(user); // Lưu lại user vào request để sử dụng ở các middleware tiếp theo (không cần dùng new User vì user đã là object rồi, có thể dùng các method của mongoose cũng như từ class User luôn )
      // Tuy nhiên, Ko cần req.user nữa vì dùng session rồi (biến user sẽ lưu vào req.session.user)
      next(); // Tiếp tục chạy các middleware tiếp theo với phân quyền
    })
    .catch((err) => {
      // {ERROR MIDDLEWARE} //
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(err);
    });
});

// {LOGIN ROUTE} //
const authRoute = require("./routes/auth");
const adminRoute = require("./routes/admin");
const personRoute = require("./routes/user");
const errorRoute = require("./routes/error");

const path = require("path");
const rootDir = require("./util/path.js");
app.use(express.static(path.join(rootDir, "public")));

app.use("/admin", adminRoute);
app.use(personRoute);
// {LOGIN ROUTE} //
app.use(authRoute);
app.use(errorRoute);

// {ERROR MIDDLEWARE} // (Phải đặt ở cuối cùng) // Nếu không có lỗi thì sẽ chạy qua các middleware trước, nếu có lỗi thì sẽ chạy qua middleware này
app.use((error, req, res, next) => {
  res.status(error.httpStatusCode).render("500", { 
    title: "Server maintenance", 
    path: "/500" 
  });
});
/// !!! Lưu ý: Nếu có lỗi thì phải truyền lỗi vào next() để nó chạy qua middleware này, nếu không thì nó sẽ chạy qua các middleware tiếp theo mà không có lỗi
