const SwaggerAutogen = require("swagger-autogen")({ openapi: "3.0.0" }); // Nhập thư viện swagger-autogen
const outputFile = "./api/swagger_output.json"; // Tạo file swagger_output.json
const endpointsFiles = [
  "./api/routes/auth.js",
  "./api/routes/admin.js",
  "./api/routes/user.js",
  "./api/routes/chat.js",
  "./api/routes/payment.js",
]; // Tạo file orders.js
// Mặc định các đường dẫn tới file này phải trỏ từ thư mục gốc của project

const doc = {
  info: {
    version: "1.0.0",
    title: "API for SHOP Website",
    description:
      "This is a REST API application made by ZDiDane for SHOP Website. \n\nIf you want to use this API, please get csrfToken first, then add csrfToken to header of request. \n\nIf you want to use API for Admin, please add bearAuth to header of request.",
      "contact": {
        "name": "ZDiDane",
        "email": "didannguyen17@gmail.com",
        "url": "https://didan.id.vn",
      },
  },
  servers: [
    {
      url: "http://localhost:3000/api",
    },
    {
      url: "https://localhost:3000/api",
    },
    {
      url: "http://shop.didan.id.vn/api",
    },
    {
      url: "https://shop.didan.id.vn/api",
    },
  ],
  tags: [
    {
      name: "Auth",
      description: "API for Auth in the system",
    },
    {
      name: "Admin",
      description: "API for Admin in the system",
    },
    {
      name: "User",
      description: "API for User in the system",
    },
    {
      name: "Chat",
      description: "API for Chat in the system",
    },
    {
      name: "Payment",
      description: "API for Payment in the system",
    },
  ], // Thêm các tags từ Postman collection nếu cần
  schemes: ["http", "https"],
  components: {
    securitySchemes: {
      csrfToken: {
        type: "apiKey",
        in: "header",
        name: "X-CSRF-Token",
      },
      bearAuth: {
        type: "http",
        scheme: "bearer",
      }
    }, // Thêm các securitySchemes để có quyền truy cập vào các API
    schemas: {
      SignUp: {
        $name: "anv",
        $email: "anv@gmail.com",
        $password: "123456",
        $re_password: "123456",
      },
      SignIn: {
        $email: "anb@gmail.com",
        $password: "123456",
      },
      Reset: {
        $email: "anv@gmai.com",
      },
      Product: {
        $name: "Iphone 12",
        $price: 1000,
        $url: "file.jpg",
        $description: "A smartphone from Apple",
      },
    },
  }, // Thêm các schemas để có thể sử dụng lại trong các API
};
const options = {
  multipart: true,
};

SwaggerAutogen(outputFile, endpointsFiles, doc, options)
// .then(() => {
//   require("../server.js"); // Đặt file chạy server ở đây (chạy sswagger.js trước rồi mới chạy server.js) => thay cả trong package.json
// }); // Tạo file swagger_output.json từ file orders.js