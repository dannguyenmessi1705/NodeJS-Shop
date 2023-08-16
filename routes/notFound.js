const express = require("express");
const route = express.Router();
const notFound = require("../controllers/404");

route.get("/*", notFound);

module.exports = route;
