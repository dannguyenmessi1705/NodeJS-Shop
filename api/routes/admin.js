const express = require("express");
const route = express.Router();
const adminController = require("../controllers/admin");
const ProtectRoute = require("../middleware/isAuth");
const { verifyCSRFToken } = require("../middleware/csrfToken");

// {TẠO CAC ENDPOINT API} //

// {VALIDATION INPUT} //
// #swagger.tags = ['Admin']
const { check } = require("express-validator");
// {VALIDATION INPUT} //
route.post(
  "/admin/add-product",
  ProtectRoute,
  verifyCSRFToken,
  [
    check("name", "Invallid name").trim().isString().notEmpty(),
    check("price", "Invalid price").isFloat().notEmpty(),
    check("description", "Please don't leave the blank description")
      .trim()
      .notEmpty(),
  ],
  adminController.postProduct
);
// #swagger.tags = ['Admin']
route.get("/admin/products", ProtectRoute, adminController.getProduct);

// {ADD EDIT PRODUCT} //
// url = "http://.../edit-poduct/id"
route.get(
  "/admin/edit-product/:productID",
  ProtectRoute,
  adminController.getEditProduct
);

// {UPDATE PRODUCT}
// {VALIDATION INPUT} //
route.put(
  "/admin/edit-product/:productID",
  ProtectRoute,
  verifyCSRFToken,
  [
    check("name", "Invallid name").trim().isString().notEmpty(),
    check("price", "Invalid price").isFloat().notEmpty(),
    check("description", "Please don't leave the blank description")
      .trim()
      .notEmpty(),
  ],
  adminController.postEditProduct
);

// {DELETE PRODUCT} //
route.delete(
  "/admin/delete-product/:productID",
  ProtectRoute,
  verifyCSRFToken,
  adminController.deleteProduct
); // Sửa method xoá sang delete

module.exports = route;
