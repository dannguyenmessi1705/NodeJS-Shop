const roomList = document.querySelectorAll(".room-list"); // Lấy tất cả các thẻ li chứa room
const displayRoom = document.getElementById("room-chat"); // Lấy thẻ div chứa room
const displayMessage = document.getElementById("message-chat"); // Lấy thẻ div chứa message
roomList.forEach((room) => {
  room.addEventListener("click", () => {
    const input = room.querySelector("input[type='hidden']"); // Lấy thẻ input ẩn chứa roomId
    const roomId = input.value; // Lấy roomId
    window.location.href = "/chat/" + roomId; // Chuyển hướng đến trang chat của roomId
  });
});
// Khi click vào button back thì hiển thị lại room chat
const back = document.querySelector(".fa-arrow-alt-circle-left");
back.addEventListener("click", () => {
  // Hiển thị lại room chat
  displayRoom.classList.remove("d-none", "d-sm-none", "d-md-none");
  displayRoom.classList.add("d-block", "d-sm-block", "d-md-block");
  // Ẩn message chat
  displayMessage.classList.remove("d-block", "d-sm-block", "d-md-block");
  displayMessage.classList.add("d-none", "d-sm-none", "d-md-none");
});
