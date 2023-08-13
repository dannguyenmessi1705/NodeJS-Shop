const express = require("express");
const route = express.Router();
const getAuth = require("../controllers/auth");

route.get("/login", getAuth.getAuth);
route.post("/login", getAuth.postAuth);
route.post("/logout", getAuth.postLogout);
route.get("/signup", getAuth.getSignup);
route.post("/signup", getAuth.postSignup);
// {RESET PASSWORD} //
route.get("/reset", getAuth.getReset);
route.post("/reset", getAuth.postReset);
// {UPDATE PASSWORD} //
route.get("/reset/:tokenReset", getAuth.getUpdatePassword)
route.post("/update-password", getAuth.postUpdatePassword)
module.exports = route;
