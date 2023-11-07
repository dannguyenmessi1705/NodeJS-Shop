const express = require("express");
const app = express();

// Thiết lập các biến môi trường
require("dotenv").config();

// Dùng helmet để bảo mật ứng dụng Express bằng cách sử dụng các HTTP header
const helmet = require("helmet");
app.use(helmet());

// Thêm Content Security Policy (CSP) để cho phép các tài nguyên nào được load từ đâu (VD: dùng google maps)
app.use(
  helmet.contentSecurityPolicy({
    // CSP là một HTTP header cho phép bạn kiểm soát các nguồn tài nguyên nào được load trên trang web của bạn
    directives: {
      // Các directives cho phép bạn chỉ định các nguồn tài nguyên nào được load trên trang web của bạn
      defaultSrc: ["'self'"], // Chỉ cho phép load các nguồn tài nguyên từ chính domain của bạn
      frameSrc: ["'self'", "https://www.google.com/"], // Chỉ cho phép load các nguồn tài nguyên từ chính domain của bạn và từ https://www.google.com/ (ví dụ: iframe)
      formAction: ["'self'", "https://sandbox.vnpayment.vn/"], // Chỉ cho phép load các nguồn tài nguyên từ chính domain của bạn và từ https://sandbox.vnpayment.vn/ (ví dụ: form)
      connectSrc: ["'self'", "https://sandbox.vnpayment.vn/"], // Chỉ cho phép load các nguồn tài nguyên từ chính domain của bạn và từ https://sandbox.vnpayment.vn/ (ví dụ: fetch, xhr, websocket)
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers
    },
  })
);

// Dùng compression để nén các file trước khi gửi đến client
const compression = require("compression");
app.use(compression());

// Dùng morgan để log các request
const morgan = require("morgan");
app.use(
  morgan("combined", {
    stream: require("fs").createWriteStream("./access.log", { flags: "a" }), // Ghi log vào file access.log (cờ "a" để thêm vào cuối file, nếu không có thì sẽ ghi đè lên file)
  })
);

// {BODY PARSER} // (Để lấy dữ liệu từ form) //
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false })); // Sử dụng body-parser để lấy dữ liệu từ form (x-www-form-urlencoded)
app.use(bodyParser.json()); // Sử dụng body-parser để lấy dữ liệu từ form (json) - dùng cho client side

// {CORS} //
const cors = require("cors");
app.use(cors());
// Nếu không dùng cors thì phải khai báo như sau:
// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*'); // cho phép tất cả các domain đều có thể gọi API
//     res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE'); // cho phép các method này
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // dùng để gửi header lên
// })
// ==== app.use(cors()); // cho phép tất cả các domain đều có thể gọi API

const path = require("path");
const rootDir = require("./util/path.js");
app.use(express.static(path.join(rootDir, "public")));

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
    secret: process.env.SECRET_KEY_SESSION, // Chuỗi bí mật để mã hoá session
    resave: false, // resave: false => Không lưu lại session nếu không có sự thay đổi (Không cần thiết)
    saveUninitialized: true, // saveUninitialized: true => Lưu session ngay cả khi chưa có sự thay đổi
    // resave vs saveUninitialized: https://stackoverflow.com/questions/40381401/when-use-saveuninitialized-and-resave-in-express-session
    store: storeDB, // Lưu session vào database
    // Ngoài ra có thể tuỳ chỉnh thêm cho cookie: secure, path, signed,... ở cấu hình session
    cookie: {
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 3, // Thời gian sống của cookie (3 ngày)
      httpOnly: true, // Chỉ có thể truy cập cookie thông qua http request, không thể truy cập bằng javascript
    },
  })
);

// {CSRF - CROSS SITE REQUEST FORGERY} // Bảo vệ trang web khỏi tấn công CSRF (Tấn công giả mạo yêu cầu trang web)
const { CreateCSRFTOKEN } = require("./middleware/csrfToken"); // Nhập middleware để tạo csrfToken
app.use(CreateCSRFTOKEN); // Sử dụng middleware để tạo token và truyền vào locals để sử dụng ở tất cả các route

// {MULTER} // (Để lấy dữ liệu file từ form) //
const multer = require("multer"); // Nhập module multer
const fileStorage = multer.diskStorage({
  // Tạo 1 storage để lưu file
  destination(req, file, callback) {
    // Định nghĩa đường dẫn lưu file
    callback(null, "images"); // Lưu file vào folder images
  },
  filename(req, file, callback) {
    // Định nghĩa tên file
    const date = new Date(); // Lấy ngày giờ hiện tại
    const formattedDate = date
      .toISOString()
      .replace(/:/g, "_")
      .replace(/\./g, ""); // Định dạng ngày giờ hiện tại (phải chuyển đổi sang dạng string mới đúng cú pháp đặt tên file)
    callback(null, formattedDate + file.originalname); // Đặt tên file = ngày giờ hiện tại + tên file gốc
  },
});
const fileFilter = (req, file, callback) => {
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
app.use(
  // Sử dụng middleware multer
  multer({
    // Định nghĩa các thuộc tính của multer
    storage: fileStorage, // Lưu file vào storage đã định nghĩa ở trên
    fileFilter: fileFilter, // Chỉ cho phép upload các loại file đã định nghĩa ở trên
  }).single("image") // // Chỉ cho phép upload 1 file duy nhất có name="image" ở formData
);
app.use("/images", express.static(path.join(rootDir, "images"))); // Định nghĩa đường dẫn tĩnh để truy cập vào folder images (để hiển thị hình ảnh đã upload) - Nếu không có dòng này thì hình ảnh sẽ không hiển thị được

// {FLASH MESSAGE} //
const flash = require("connect-flash");
app.use(flash());

app.set("view engine", "ejs");
app.set("views", "./views");

// {RUN SERVER + Add user to req (Phân quyền) + SOCKET.IO} //
const mongoose = require("mongoose"); // Nhập module mongoose
const User = require("./models/users"); // Nhập vào class User lấy từ file users.js
const fs = require('fs')
const https = require('https')
const cert = fs.readFileSync('server.cert')
const key = fs.readFileSync('server.key')

mongoose
  .connect(URL)
  .then(() => {
    // const server = https.createServer({cert: cert, key: key}, app).listen(process.env.PORT);
    const server = app.listen(process.env.PORT)
    // {SOCKET.IO} //
    const io = require("./util/socket").init(server); // Khởi tạo socket.io và lưu vào biến io, sẽ được khởi tạo ở file server.js
    console.log("Connected!");
    io.on("connection", (socket) => {
      // socket là 1 object chứa các thông tin của client
      // Khi có 1 client kết nối đến server thì sẽ chạy hàm này với biến socket là 1 object chứa các thông tin của client
      console.log("Client connected!");
      socket.on("message", (message) => {
        // Khi client gửi 1 message lên server thì sẽ chạy hàm này
        console.log(message);
      });
      socket.on("disconnect", () => {
        // Khi client disconnect thì sẽ chạy hàm này
        console.log("Client disconnected!");
      });
    });
  }) // Kết nối với database, sau đó mới chạy server
  .catch((err) => {
    console.log(err);
  });

// {MIDDLEWARE PHÂN QUYỀN DÙNG SESSION} //
app.use(async (req, res, next) => {
  if (!req.session?.user) {
    res.locals.userID = undefined; // Truyền biến user vào locals để sử dụng ở tất cả các route
    // Nếu không có session user thì return next() để chạy các middleware tiếp theo mà không có phân quyền
    return next();
  }
  try {
    const user = await User.findById(req.session.user._id); // Tìm kiếm user trong collection users có id trùng với id của session user
    // Nếu ko tìm thấy user => chuyển hướng mà không có phân quyền
    if (!user) {
      res.locals.userID = undefined; // Truyền biến user vào locals để sử dụng ở tất cả các route
      next();
    }
    // Nếu tìm thấy user thì lưu vào req.user
    req.user = new User(user); // Lưu lại user vào request để sử dụng ở các middleware tiếp theo (không cần dùng new User vì user đã là object rồi, có thể dùng các method của mongoose cũng như từ class User luôn )
    res.locals.userID = req.session.user._id.toString(); // Truyền biến user vào locals để sử dụng ở tất cả các route
    res.locals.username = req.session.user.username; // Truyền biến user vào locals để sử dụng ở tất cả các route
    // Tuy nhiên, Ko cần req.user nữa vì dùng session rồi (biến user sẽ lưu vào req.session.user)
    next(); // Tiếp tục chạy các middleware tiếp theo với phân quyền
  } catch (err) {
    if (!err.httpStatusCode) {
      err.httpStatusCode = 500;
    }
    next(err);
  }
});

// {ROUTE SERVER SIDE} //
const authRoute = require("./routes/auth");
const adminRoute = require("./routes/admin");
const personRoute = require("./routes/user");
const paymentRoute = require("./routes/payment");
const chatRoute = require("./routes/chat");
const errorRoute = require("./routes/error");
app.use("/admin", adminRoute);
app.use(personRoute);
// {LOGIN ROUTE} //
app.use(authRoute);
app.use(paymentRoute);
app.use(chatRoute);

// {SWAGGER API} //
const swaggerUi = require("swagger-ui-express");
const swaggerDoc = require("./api/swagger_output.json");
app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// {ENPOINT API ROUTE FOR CLIENT} //
const authRouteAPI = require("./api/routes/auth");
const adminRouteAPI = require("./api/routes/admin");
const personRouteAPI = require("./api/routes/user");
const paymentRouteAPI = require("./api/routes/payment");
app.use("/api", adminRouteAPI);
app.use("/api", personRouteAPI);
// {LOGIN ROUTE} //
app.use("/api", authRouteAPI);
app.use("/api", paymentRouteAPI);

// Phải đặt các route lỗi ở cuối cùng
app.use(errorRoute);

// {ERROR MIDDLEWARE} // (Phải đặt ở cuối cùng) // Nếu không có lỗi thì sẽ chạy qua các middleware trước, nếu có lỗi thì sẽ chạy qua middleware này
// app.use((err, req, res, next) => {
//   res.status(500).render("500", {
//     title: "Server maintenance",
//     path: "/500",
//     authenticate: req.session.isLogin, // Vì đây là trang lỗi được ưu tiên thực hiện trước các route khác nên chưa có session, nên phải truyền biến authenticate vào để sử dụng ở header
//   });
// });
/// !!! Lưu ý: Nếu có lỗi thì phải truyền lỗi vào next() để nó chạy qua middleware này, nếu không thì nó sẽ chạy qua các middleware tiếp theo mà không có lỗi
