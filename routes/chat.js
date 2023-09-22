const express = require("express");
const route = express.Router();
const ChatController = require("../controllers/chat");
const ProtectRoute = require("../middleware/isAuth")
// {GET CHAT PAGE} //
route.get("/chat", ProtectRoute, ChatController.getChat);

// {POST CHAT} //
route.post("/chat", ProtectRoute, ChatController.postChat);

// {GET ROOM CHAT} //
route.get("/chat/:roomID", ProtectRoute, ChatController.getRoom); 

// {GET ROOM CHAT JSON} //
route.get("/chat1/:roomID", ProtectRoute, ChatController.getRoom1);

module.exports = route;
