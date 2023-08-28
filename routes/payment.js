const express = require("express");
const route = express.Router();
const Payment = require("../controllers/payment");
const ProtectRoute = require("../middleware/auth");

route.post("/payment", ProtectRoute, Payment.getPayment);

module.exports = route;
