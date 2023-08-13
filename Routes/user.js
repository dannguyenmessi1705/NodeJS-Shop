const express = require("express");
const route = express.Router();

const userController = require("../controllers/user");

route.get("/", userController.getIndex);

route.get("/product", userController.getProduct);

// {ADD PRODUCT ID} //
route.get("/product/:productID", userController.getDetail); // :productID là dynamic route, nó sẽ được thay thế bằng id của sản phẩm,
// vì là dynamic route nên tên route product/:productID bắt buộc phải đặt ở sau các route cố định của product/... khác, để cho đỡ hiểu nhầm với các route cố định

// {CART} //
route.get("/cart", userController.getCart)
route.post("/cart", userController.postCart)
route.post("/delete-cart", userController.deleteCart)

// {GET, ADD PRODUCT FROM CART TO ORDER} //
route.get("/order", userController.getOrder);
route.post("/add-order", userController.postOrder);


module.exports = route;
