const express = require("express");
const route = express.Router(); 
const adminController = require("../controllers/admin") 
const ProtectRoute = require("../middleware/auth")

route.get("/add-product", ProtectRoute, adminController.addProduct); 
route.post("/add-product", ProtectRoute, adminController.postProduct); 
route.get("/product", ProtectRoute, adminController.getProduct);

// {ADD EDIT PRODUCT} //
// url = "http://.../edit-poduct/id"
route.get("/edit-product/:productID", ProtectRoute, adminController.getEditProduct)
// {UPDATE PRODUCT}
route.post("/edit-product", ProtectRoute, adminController.postEditProduct)

// {DELETE PRODUCT} //
route.post("/delete-product", ProtectRoute, adminController.deleteProduct)

module.exports = route;
