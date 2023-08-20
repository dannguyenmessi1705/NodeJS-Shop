const express = require("express");
const route = express.Router();
const error = require("../controllers/error");

route.get("/500-maintenance", error.serverError)
route.get("/*", error.notFound);

module.exports = route;
