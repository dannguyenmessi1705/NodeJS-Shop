const express = require("express");
const route = express.Router();
const userController = require("../controllers/user");
const ProtectRoute = require("../middleware/isAuth");
const { verifyCSRFToken } = require("../middleware/csrfToken");

/*
 #swagger.tags = ['User'] 
 */
route.get("/", userController.getIndex);

route.get("/products", userController.getAllProduct);

// {GET FIND PRODUCT} //
route.get("/find-product", userController.getFindProduct);

// {ADD PRODUCT ID} //
route.get("/products/:productID", userController.getDetail); // :productID là dynamic route, nó sẽ được thay thế bằng id của sản phẩm,
// vì là dynamic route nên tên route product/:productID bắt buộc phải đặt ở sau các route cố định của product/... khác, để cho đỡ hiểu nhầm với các route cố định

// {CART} //
route.get("/cart", ProtectRoute, userController.getCart);
route.patch(
  "/cart/:productID",
  ProtectRoute,
  verifyCSRFToken,
  userController.postCart
);
route.patch(
  "/delete-cart/:productID",
  ProtectRoute,
  verifyCSRFToken,
  userController.deleteCart
);

// {GET, ADD PRODUCT FROM CART TO ORDER} //
route.get("/orders", ProtectRoute, userController.getOrder);
route.post(
  "/add-order",
  ProtectRoute,
  verifyCSRFToken,
  userController.postOrder
);

// {GET INVOICE} //
route.get("/order/:orderId", ProtectRoute, userController.getInvoice);

module.exports = route;
