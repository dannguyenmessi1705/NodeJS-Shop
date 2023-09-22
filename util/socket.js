let ioServer; // Tạo biến io để lưu socket ở máy chủ
const Socket = {
  init: (httpServer) => {
    // Khởi tạo socket.io ở máy chủ
    // httpServer là server được tạo ở file server.js (VD như app.listen(3000))
    const { Server } = require("socket.io"); // Nhập module socket.io
    ioServer = new Server(httpServer); // Khởi tạo socket.io và lưu vào biến io, sẽ được khởi tạo ở file server.js
    return ioServer; // Trả về biến io
  },
  getIO: () => {
    // Lấy biến io của Server để sử dụng ở các file khác
    if (!ioServer) {
      // Nếu chưa khởi tạo socket.io thì throw error
      throw new Error("Socket.io not initialized!");
    }
    return ioServer; // Nếu đã khởi tạo thì trả về biến io
  },
};
module.exports = Socket; // Xuất module Socket để sử dụng ở các file khác
