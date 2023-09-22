const { io } = require("socket.io-client")
const socket = new io("http://localhost:3000"); // Khởi tạo socket.io ở clien, nếu io() thì mặc định là cùng domain với server
socket.on("message", (data) => {
    console.log("Client connected!");
    console.log(data);
})
socket.emit("message", "Hello from client!") // Gửi 1 message lên server