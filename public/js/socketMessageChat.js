let chat = []; // Khởi tạo mảng chứa các message
let data; // Khởi tạo biến chứa dữ liệu từ server
const roomId = document.querySelector("input[name='roomId']").value; // Lấy roomId từ input ẩn
const token = document.querySelector("input[name='jwttoken']").value; // Lấy token từ input ẩn
const messageTag = document.getElementById("messages"); // Lấy thẻ ul chứa các message
fetch("/chat" + "/" + roomId, {
  // Gửi request lên server để lấy dữ liệu
  method: "GET", // Phương thức GET
  headers: {
    // Các header cần thiết
    "Content-Type": "application/json", // Content-Type là application/json
    Authorization: "Bearer " + token, // Authorization là Bearer + token
  },
})
  .then((js) => js.json()) // Chuyển dữ liệu nhận được từ json sang javascript
  .then((res) => {
    data = res; // Gán dữ liệu nhận được vào biến data
    chat = [...data.room.messages]; // Gán các message vào mảng chat
  });
import { io } from "/js/socket.io-client.min.js"; // Import thư viện socket.io-client (đã được tải về từ server vì đây là file view nên chir có thể impport được thư viện đã được public)
const socket = new io(); // Tạo 1 socket mới
socket.on("connect", (socket) => {
  // Khi socket kết nối thành công
  console.log("Connected to server!");
});
// socket.emit("message", "Hello from client!") // Gửi 1 message lên server
socket.on("message", (m) => {
  // Khi nhận được message từ server
  if (roomId === m.countUnReadOnRoom._id) {
    // Nếu roomId của message nhận được trùng với roomId của trang chat hiện tại thì mới render message lên màn hình
    const lastli = messageTag.lastElementChild;
    // render message lên màn hình sau khi get messageTag
    const li = document.createElement("li"); // Tạo một thẻ li mới
    if (data.userId.toString() === m.chats.sender._id.toString()) {
      // Nếu người gửi là người đang đăng nhập
      li.classList.add("d-flex", "justify-content-end", "my-2"); // Thêm class vào thẻ li vừa tạo để hiển thị message bên phải
    } else {
      // Nếu người gửi không phải là người đang đăng nhập
      li.classList.add("my-2"); // Thêm class vào thẻ li vừa tạo để hiển thị message bên trái
    }
    const div = document.createElement("div"); // Tạo một thẻ div mới
    div.classList.add("card", "border", "border-muted", "bg-light-subtle"); // Thêm class vào thẻ div vừa tạo
    div.style.width = "81%"; // Đặt chiều rộng của thẻ div vừa tạo
    if (data.userId.toString() === m.chats.sender._id.toString()) {
      // Nếu người gửi là người đang đăng nhập
      div.style.borderTopLeftRadius = "20px"; // Đặt border radius cho thẻ div vừa tạo
      div.style.borderTopRightRadius = "0px"; // Đặt border radius cho thẻ div vừa tạo
      div.style.borderBottomRightRadius = "20px"; // Đặt border radius cho thẻ div vừa tạo
      div.style.borderBottomLeftRadius = "20px"; // Đặt border radius cho thẻ div vừa tạo
    } else {
      // Nếu người gửi không phải là người đang đăng nhập
      div.style.borderTopLeftRadius = "0px";
      div.style.borderTopRightRadius = "20px";
      div.style.borderBottomRightRadius = "20px";
      div.style.borderBottomLeftRadius = "20px";
    }
    const div1 = document.createElement("div"); // Tạo một thẻ div mới để chứa nội dung message
    div1.classList.add("card-body", "text-center", "p-2"); // Thêm class vào thẻ div vừa tạo
    const img = document.createElement("img"); // Tạo một thẻ img mới để chứa ảnh
    if (m.url) {
      // Nếu message có chứa ảnh
      img.classList.add("img-fluid", "mb-2");
      img.src = "/" + m.chats.url; // Đặt src cho thẻ img vừa tạo
      img.style.maxHeight = "30rem"; // Đặt chiều cao tối đa cho thẻ img vừa tạo
      img.style.height = "auto"; // Đặt chiều cao cho thẻ img vừa tạo
      img.style.minHeight = "10rem"; // Đặt chiều cao tối thiểu cho thẻ img vừa tạo
    }
    const p = document.createElement("p"); // Tạo một thẻ p mới để chứa nội dung message
    p.classList.add("text-start", "card-text"); // Thêm class vào thẻ p vừa tạo
    p.style.fontSize = "1rem"; // Đặt font size cho thẻ p vừa tạo
    p.innerHTML = m.chats.message; // Đặt nội dung cho thẻ p vừa tạo
    const h6 = document.createElement("h6"); // Tạo một thẻ h6 mới để chứa người gửi và thời gian gửi message
    h6.classList.add("text-muted", "card-subtitle", "text-end"); // Thêm class vào thẻ h6 vừa tạo
    h6.style.fontSize = ".75rem"; // Đặt font size cho thẻ h6 vừa tạo
    h6.innerHTML = m.sender + " " + m.time; // Đặt nội dung cho thẻ h6 vừa tạo
    if (m.url) {
      // Nếu message có chứa ảnh
      div1.appendChild(img); // Thêm thẻ img vào thẻ div1
    }
    div1.appendChild(p); // Thêm thẻ p vào thẻ div1
    div1.appendChild(h6); // Thêm thẻ h6 vào thẻ div1
    div.appendChild(div1); // Thêm thẻ div1 vào thẻ div
    li.appendChild(div); // Thêm thẻ div vào thẻ li
    lastli.insertAdjacentElement("afterend", li); // Thêm thẻ li vào sau thẻ li cuối cùng

    // Kéo xuống cuối cùng khi có message mới
    const scrollBar = document.getElementById("scroll-bar"); // Lấy thẻ scroll-bar
    scrollBar.scrollTop = scrollBar.scrollHeight; // Đặt scroll-bar xuống cuối cùng
  }

  // Thông báo chỉ trên thiết bị nhận message, không phải thiết bị gửi message
  if (
    data.userId !== m.chats.sender._id &&
    data.userId === m.chats.receiver._id
  ) {
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
