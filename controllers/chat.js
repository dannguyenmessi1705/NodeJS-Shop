const Chat = require("../models/chats");
const Room = require("../models/rooms");

// {GET CHAT} //
const getChat = async (req, res, next) => {
  try {
    const rooms = await Room.find({ participants: req.user._id }) // Tìm kiếm các room có id của user hiện tại trong participants
      .populate("participants", "username") // Populate các field participants với các field name
      .populate("messages", "message url sender receiver createdAt") // Populate các field messages với các field message, createdAt
      .sort({ "messages.createdAt": -1 }); // Sắp xếp các room theo thời gian tạo của message mới nhất
    // GET LATEST MESSAGE //
    let latestMessages; // Khởi tạo mảng latestMessages
    if (rooms.length > 0) {
      // Nếu không có room nào thì return res.render() để render ra trang chat với mảng rooms rỗng
      latestMessages = rooms[0]; // Khởi tạo mảng latestMessages
    } else {
      latestMessages = []; // Khởi tạo mảng latestMessages
    }
    res.render("./user/chat", {
      title: "Chat",
      path: "/chat",
      rooms,
      room: latestMessages,
      userId: req.user._id,
      token: req.session.accessToken,
    });
  } catch (error) {
    const err = new Error(error);
    err.httpStatusCode = 500;
    next(err);
  }
};

// {POST CHAT} //
const postChat = async (req, res, next) => {
  try {
    const productId = req.body.id || undefined; // Nếu không có id thì mặc định là undefined
    const message = req.body.message || "Sản phẩm này còn hàng không?"; // Nếu không có message thì mặc định là "Sản phẩm này còn hàng không?"
    const url = req.body.url || undefined; // Nếu không có url thì mặc định là ""
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
        countUnRead: 1, // Mặc định là 1 vì vừa tạo mới room nên chưa đọc
      });
      countUnReadOnRoom = await newRoom.save(); // Lưu room vào collection rooms
    } else {
      // Nếu tìm thấy room thì cập nhật lại room
      countUnReadOnRoom = await Room.findByIdAndUpdate(room._id, {
        // Cập nhật lại room
        $inc: { countUnRead: 1 }, // Tăng countUnRead lên 1
        $push: { messages: chats._id }, // Thêm id của chat vào messages
      });
    }
    const senderSOC = (await chat.populate("sender", "username")).sender
      .username; // Lấy username của sender
    const receiverSOC = (await chat.populate("receiver", "username")).receiver
      .username; // Lấy username của receiver
    const io = require("../util/socket").getIO(); // Lấy biến io từ file socket.js
    io.emit("message", {
      // Gửi message lên client
      userId: req.user._id, // Id của user hiện tại
      sender: senderSOC, // Username của sender
      receiver: receiverSOC, // Username của receiver
      chats, // Thông tin của message
      time: chats.createdAt.toLocaleString('en-US', {timeZone: 'Asia/Ho_Chi_Minh'}), // Thời gian tạo message
      countUnReadOnRoom, // Thông tin của room
      countUnRead: countUnReadOnRoom?.countUnRead || 1, // Nếu countUnReadOnRoom không tồn tại thì mặc định là 1
    });
    if (productId) {
      // Nếu có productId thì chuyển hướng đến trang chat với id của room, ngược lại thì có nghĩa là đang ở sẵn trong room rồi => dùng socket để gửi message lên client
      res.redirect(`/chat/${countUnReadOnRoom._id}`); // Chuyển hướng đến trang chat với id của room
    }
  } catch (error) {
    const err = new Error(error);
    err.httpStatusCode = 500;
    next(err);
  }
};

// {GET ROOM} //
const getRoom = async (req, res, next) => {
  try {
    const roomID = req.params.roomID; // Lấy id của room từ params
    const sender = req.user._id; // Lấy id của user hiện tại
    const rooms = await Room.find({ participants: sender }) // Tìm kiếm room có id và participants là sender
      .populate("participants", "username") // Populate các field participants với các field name và avatar
      .populate("messages", "message url sender receiver createdAt") // Populate các field messages với các field message, url, sender, receiver, createdAt
      .sort({ "messages.createdAt": -1 }); // Sắp xếp các room theo thời gian tạo của message mới nhất
    const room = rooms.find((room) => room._id.toString() === roomID); // Tìm kiếm room có id trùng với roomID
    if (!room) {
      // Nếu không tìm thấy room thì chuyển hướng đến trang chat
      return res.redirect("/chat");
    }
    console.log(rooms);
    res.render("./user/chat", {
      title: "Room",
      path: "/chat",
      rooms,
      room,
      userId: req.user._id,
      token: req.session.accessToken,
    });
  } catch (error) {
    const err = new Error(error);
    err.httpStatusCode = 500;
    next(err);
  }
};
// {GET ROOM JSON} //
const getRoom1 = async (req, res, next) => {
  try {
    const roomID = req.params.roomID; // Lấy id của room từ params
    const sender = req.user._id; // Lấy id của user hiện tại
    const rooms = await Room.find({ participants: sender }) // Tìm kiếm room có id và participants là sender
      .populate("participants", "username") // Populate các field participants với các field name và avatar
      .populate("messages", "message url sender receiver createdAt") // Populate các field messages với các field message, url, sender, receiver, createdAt
      .sort({ "messages.createdAt": -1 }); // Sắp xếp các room theo thời gian tạo của message mới nhất
    const room = rooms.find((room) => room._id.toString() === roomID); // Tìm kiếm room có id trùng với roomID
    if (!room) {
      // Nếu không tìm thấy room thì chuyển hướng đến trang chat
      return res.redirect("/chat");
    }
    res.json({
      title: "Room",
      path: "/chat",
      rooms,
      room,
      userId: req.user._id,
      token: req.session.accessToken,
    });
  } catch (error) {
    const err = new Error(error);
    err.httpStatusCode = 500;
    next(err);
  }
};

module.exports = {
  getChat,
  postChat,
  getRoom,
  getRoom1,
};
