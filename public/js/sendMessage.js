const send = document.getElementById("send"); // Lấy thẻ button send
const parent = send.parentNode.parentNode; // Lấy thẻ cha của thẻ button send
const input = parent.querySelector("input[name='message']"); // Lấy thẻ input chứa message
let message = ""; // Khởi tạo biến chứa message
input.oninput = () => {
  // Khi nhập message
  message = input.value; // Gán message
};
document.addEventListener("keyup", (event) => {
  // Khi nhấn phím
  if (event.keyCode === 13 && message !== "") {
    // Nếu nhấn phím Enter và message không rỗng
    send.click(); // Gọi sự kiện click cho button send
  }
});
send.addEventListener("click", () => {
  // Khi click button send
  const id = document.querySelector("input[name='roomId']").value; // Lấy roomId từ input ẩn
  const receiver = document.querySelector("input[name='receiver']").value; // Lấy receiver từ input ẩn
  const csrf = document.querySelector("input[name='_csrf']").value; // Lấy CSRF Token
  const token = document.querySelector("input[name='jwttoken']").value; // Lấy JWT Token
  // Gửi message lên server
  if (input.value !== "") {
    // Nếu message không rỗng thì mới gửi
    fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrf,
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        message: message,
        receiver: receiver,
      }),
    })
      .then((res) => res.json())
      .catch((err) => console.log(err));
    input.value = ""; // Xoá input
  }
});
