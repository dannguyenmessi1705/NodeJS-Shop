const btn = document.querySelector(".btn.btn-danger"); // Chọn button có class là btn và danger (nút xóa)
const deleteProduct = (btn) => {
  // Tạo hàm xóa
  const productId = btn.parentNode.querySelector("input[name=id]").value; // Lấy id của sản phẩm
  const csrf_token = btn.parentNode.querySelector("input[name=_csrf]").value; // Lấy token để xác thực khi xoá
  const item = btn.closest(".card-dan"); // Lấy thẻ cha của button có class là card và product-item
  fetch(`delete-product/${productId}`, {
    // Gửi request lên server
    method: "DELETE", // Sử dụng method delete
    headers: {
      // Gửi header lên server
      "csrf-token": csrf_token, // Gửi token lên server để xác thực khi xoá sản phẩm (phòng trường hợp bị tấn công CSRF)
    },
  })
    .then((result) => {
      // Nhận kết quả trả về
      return result.json().then((message) => {
        // Chuyển kết quả trả về thành json
        console.log(message); // In ra kết quả trả về
        item.remove(); // Xoá sản phẩm khỏi giao diện
      });
    })
    .catch((err) => console.log(err)); // Bắt lỗi
};
