const express = require("express");
const route = express.Router();
const Payment = require("../controllers/payment");
const ProtectRoute = require("../middleware/auth");
// {PAYMENT} //
// Chuyển hướng đến trang thanh toán của VNPAY
route.post("/payment", ProtectRoute, Payment.getPayment);

// Trả về kết quả thanh toán
route.get("/payment/vnpay_return", ProtectRoute, Payment.VNPayReturn);

module.exports = route;
