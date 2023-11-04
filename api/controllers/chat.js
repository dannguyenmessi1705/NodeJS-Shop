const Chat = require("../../models/chats");
const Room = require("../../models/rooms");

// {GET LIST CHAT ROOM} //
const getChat = async (req, res, next) => {
  /*
    #swagger.tags = ['Chat']
    #swagger.summary = 'Get list chat room'
    #swagger.description = 'Endpoint to get list chat room'
    #swagger.security = [{
      "csrfToken": [],
      "bearAuth": []
    }]

  */
  try {
    const rooms = await Room.find({ participants: req.user._id }) // Tìm kiếm các room có id của user hiện tại trong participants
      .populate("participants", "username") // Populate các field participants với các field name
      .populate("messages", "message url sender receiver createdAt") // Populate các field messages với các field message, createdAt
      .sort({ updatedAt: -1 }); // Sắp xếp các room theo thời gian cập nhật của message mới nhất
    // GET LATEST MESSAGE //
    let latestMessages; // Khởi tạo mảng latestMessages
    if (rooms.length > 0) {
      // Nếu không có room nào thì return res.render() để render ra trang chat với mảng rooms rỗng
      latestMessages = rooms[0]; // Khởi tạo mảng latestMessages
    } else {
      latestMessages = []; // Khởi tạo mảng latestMessages
    }
    res.status(200).json({
      title: "Chat",
      path: "/chat",
      rooms,
      room: latestMessages,
      userId: req.user._id,
      token: req.session.accessToken,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// {POST CHAT} //
const postChat = async (req, res, next) => {
  /*
    #swagger.tags = ['Chat']
    #swagger.summary = 'Create chat message'
    #swagger.description = 'Endpoint to create chat message'
    #swagger.security = [{
      "csrfToken": [],
      "bearAuth": []
    }]
    #swagger.requestBody = {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            "type": "object",
            "properties": {
              "id": {
                description: "Id of product, can be null",
                "type": "string",
                required: false,
              },
              "url": {
                description: "Url of product, can be null",
                "type": "string",
                required: false,
              },
              "message": {
                description: "Message of chat",
                "type": "string",
                required: true,
              },
              "receiver": {
                description: "Id of receiver",
                "type": "string",
                required: true,
              }
            },
            "required": [
              "message",
              "receiver"
            ]
          }
        }
      }
    }
  */
  try {
    const productId = req.body.id || undefined; // Nếu không có id thì mặc định là undefined
    const url = req.body.url || undefined; // Nếu không có url thì mặc định là ""
    const message = req.body.message || "Sản phẩm này còn hàng không?"; // Nếu không có message thì mặc định là "Sản phẩm này còn hàng không?"
    const sender = req.user._id; // Lấy id của user hiện tại
    const receiver = req.body.receiver || req.params.receiverID; // Nếu không có receiver thì lấy receiver từ params
    const chat = new Chat({
      message,
      url: url ? url : undefined,
      sender,
      receiver,
    });
    let countUnReadOnRoom; // Khởi tạo biến countUnReadOnRoom
    const chats = await chat.save(); // Lưu chat vào collection chats
    const room = await Room.findOne({
      participants: { $all: [sender, receiver] },
    }); // Tìm kiếm room có 2 participants là sender và receiver
    if (!room) {
      // Nếu không tìm thấy room thì tạo mới room
      const newRoom = new Room({
        participants: [sender, receiver], // Lưu id của sender và receiver vào participants
        messages: [chats._id], // Lưu id của chat vào messages
        marked: false, // Mặc định là false (chưa đọc tin nhắn)
        countUnRead: 1, // Mặc định là 1 vì vừa tạo mới room nên chưa đọc
      });
      countUnReadOnRoom = await newRoom.save(); // Lưu room vào collection rooms
    } else {
      // Nếu tìm thấy room thì cập nhật lại room
      countUnReadOnRoom = await Room.findByIdAndUpdate(room._id, {
        // Cập nhật lại room
        $inc: { countUnRead: 1 }, // Tăng countUnRead lên 1
        $push: { messages: chats._id }, // Thêm id của chat vào messages
        marked: false, // Đánh dấu là chưa đọc tin nhắn
      });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// {GET ROOM} //
const getRoom = async (req, res, next) => {
  /*
    #swagger.tags = ['Chat']
    #swagger.summary = 'Get all messages in room chat'
    #swagger.description = 'Endpoint to get room chat'
    #swagger.security = [{
      "csrfToken": [],
      "bearAuth": []
    }]
    #swagger.parameters['roomID'] = {
      in: 'path',
      description: 'Id of room',
      required: true,
      type: 'string'
    }
  */
  try {
    const roomID = req.params.roomID; // Lấy id của room từ params
    const sender = req.user._id; // Lấy id của user hiện tại
    const rooms = await Room.find({ participants: sender }) // Tìm kiếm room có id và participants là sender
      .populate("participants", "username") // Populate các field participants với các field name và avatar
      .populate("messages", "message url sender receiver createdAt") // Populate các field messages với các field message, url, sender, receiver, createdAt
      .sort({ updatedAt: -1 }); // Sắp xếp các room theo thời gian tạo của message mới nhất
    // Tìm kiếm room có id trùng với roomID
    const room = rooms.find((room) => room._id.toString() === roomID);
    if (!room) {
      // Nếu không tìm thấy room thì chuyển hướng đến trang chat
      return res.redirect("/chat");
    }
    // Cập nhật lại room đã đọc tin nhắn
    room.marked = true; // Đã đọc tin nhắn
    room.countUnRead = 0; // Đã đọc tin nhắn nên countUnRead = 0
    await room.save(); // Lưu room vào collection rooms
    return res.status(200).json({
      title: "Room",
      path: "/chat",
      rooms,
      room,
      userId: req.user._id,
      token: req.session.accessToken,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getChat,
  postChat,
  getRoom,
};
