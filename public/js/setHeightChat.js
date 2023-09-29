// set chiều cao cho content
function setHeight() {
  // Lấy chiều cao của cửa sổ trình duyệt
  var windowHeight = window.innerHeight;
  // Lấy chiều cao của thanh điều hướng
  var navHeight = document.getElementsByTagName("nav")[0].offsetHeight;
  // Tính chiều cao của phần nội dung
  var containerHeight = windowHeight - navHeight;
  const inputHeight = document.getElementById("inputsend").offsetHeight; // Lấy chiều cao của input
  const userinfo = document.getElementById("userinfo").offsetHeight; // Lấy chiều cao của userinfo
  document.getElementById("content").style.height =
    containerHeight - inputHeight - userinfo - 7 + "px"; // Set the height of the content element
  // Đặt chiều cao cho container-fluid và scroll-bar
  document.querySelector(".container-fluid").style.height =
    containerHeight + "px";
  document.getElementById("scroll-bar").style.height =
    containerHeight - inputHeight - userinfo - 10 + "px";
}

setHeight();
// Gọi hàm setHeight khi cửa sổ trình duyệt thay đổi kích thước
window.addEventListener("resize", setHeight);
window.addEventListener("orientationchange", setHeight);
window.addEventListener("load", setHeight);
window.addEventListener("DOMContentLoaded", setHeight);

// Kéo xuống cuối cùng khi load trang
function scrollToBottom() {
  const scrollBar = document.getElementById("scroll-bar"); // Lấy thẻ scroll-bar
  scrollBar.scrollTop = scrollBar.scrollHeight; // Đặt scroll-bar xuống cuối cùng
}
scrollToBottom();
window.addEventListener("load", scrollToBottom);
