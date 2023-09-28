const themeToggle = document.getElementById("theme");
const htmlElement = document.documentElement;

// Kiểm tra nếu đã có giá trị chế độ giao diện trong cookie
const cookieTheme = getCookie("theme");
if (cookieTheme) {
  htmlElement.setAttribute("data-bs-theme", cookieTheme);
  // Cập nhật trạng thái của công tắc dựa trên giá trị đã lưu
  themeToggle.checked = cookieTheme === "dark";
}
themeToggle.addEventListener("change", (event) => {
  const isDarkMode = event.target.checked;
  updateTheme(isDarkMode);
});

document.addEventListener("click", (event) => {
  const target = event.target;
  const isToggleSwitch =
    target.matches(".theme__toggle") ||
    target.closest(".theme__toggle") !== null;
  if (!isToggleSwitch) {
    const isDarkMode = themeToggle.checked;
    updateTheme(isDarkMode);
  }
});

// Hàm cập nhật giao diện
function updateTheme(isDarkMode) {
  if (isDarkMode) {
    htmlElement.setAttribute("data-bs-theme", "dark");
    // Lưu trạng thái giao diện vào cookie khi công tắc được chọn
    setCookie("theme", "dark", 365);
  } else {
    htmlElement.setAttribute("data-bs-theme", "light");
    // Lưu trạng thái giao diện vào cookie khi công tắc không được chọn
    setCookie("theme", "light", 365);
  }
}

// Hàm thiết lập cookie
function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

// Hàm truy xuất giá trị của cookie
function getCookie(name) {
  const cookieArr = document.cookie.split(";");
  for (let i = 0; i < cookieArr.length; i++) {
    const cookiePair = cookieArr[i].split("=");
    const cookieName = cookiePair[0].trim();
    if (cookieName === name) {
      return cookiePair[1];
    }
  }
  return null;
}
