const userId = document.querySelector("input[name = 'userId']").value; // Lấy userId từ input ẩn
import { io } from "/js/socket.io-client.min.js"; // Import thư viện socket.io-client (đã được tải về từ server vì đây là file view nên chir có thể impport được thư viện đã được public)
const socket = new io(); // Tạo 1 socket mới
socket.on("connect", (socket) => {
  // Khi socket kết nối thành công
  console.log("Connected to server!");
});
// socket.emit("message", "Hello from client!") // Gửi 1 message lên server
socket.on("message", (m) => {
  // kiểm tra xem có đang ở trong trang chat không nếu có thì không hiển thị thông báo
  // Nếu không phải là trang chat thì mới hiển thị thông báo
  // lấy url hiện tại
  const url = window.location.href;
  if (userId === m.chats.receiver._id && url.includes("/chat") == false) {
    // Nếu userId của người nhận message trùng với userId của người đang đăng nhập thì mới hiển thị message
    // Khi nhận được message từ server, tạo 1 thẻ sau thẻ nav để hiển thị message
    const isNewMessage = document.getElementById("newMessage");
    if (isNewMessage) {
      isNewMessage.remove();
    } // xóa message cũ
    const div = document.createElement("div");
    div.classList.add("d-flex", "align-items-center", "pt-2", "bg-dark-subtle");
    // thêm classid để xóa message sau khi đã đọc
    div.setAttribute("id", "newMessage");
    const div1 = document.createElement("div");
    div1.setAttribute("data-aos", "fade-down");
    div1.classList.add(
      "alert",
      "alert-primary",
      "d-inline-block",
      "text-center",
      "mx-auto",
      "fw-bold",
      "text-success"
    );
    // thêm thẻ a dẫn đến trang chat
    const a = document.createElement("a");
    a.style.textDecoration = "none";
    a.href = "/chat/" + m.countUnReadOnRoom._id;
    a.innerHTML = m.sender + ": " + m.chats.message;
    div1.appendChild(a);
    div.appendChild(div1);
    // đặt thẻ này ngay sau thẻ nav để hiển thị message
    const nav = document.querySelector("nav");
    document.body.insertBefore(div, nav.nextSibling);
  }
  // Thông báo chỉ trên thiết bị nhận message, không phải thiết bị gửi message
  if (userId !== m.chats.sender._id && userId === m.chats.receiver._id) {
    notify(); // Thông báo
    // if (Notification.permission === "granted") { // Nếu đã được cấp quyền thông báo
    // notify(); // Thông báo
    // }
    // else if (Notification.permission !== "denied") { // Nếu chưa được cấp quyền thông báo
    //     Notification.requestPermission().then(permission => { // Yêu cầu cấp quyền thông báo
    //         if (permission === "granted") { // Nếu được cấp quyền thông báo
    //             notify(); // Thông báo
    //         }
    //     })
    // }
    // Xin quyền thông báo trên thiết bị nhận message (mobile hoặc máy tính)
  }
});
const notify = () => {
  const soundPath = "/sound/notification.mp3";
  const audio = new Audio(soundPath);
  audio.play();
};
