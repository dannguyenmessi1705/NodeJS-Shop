const moment = require("moment"); // module để xử lý thời gian
const crypto = require("crypto"); // module để mã hóa dữ liệu
const CC = require("currency-converter-lt"); // module để chuyển đổi tiền tệ
const querystring = require("qs"); // module để chuyển đổi object thành chuỗi query
const config = {
  vnp_TmnCode: "54FXX7NZ", // Mã website tại VNPAY
  vnp_HashSecret: "EIFPXFPSHZGYLFHEWJJIBJSESLERCVDW", // Chuỗi bí mật
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html", // Đường dẫn thanh toán
  vnp_Api: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction", // Đường dẫn API
  vnp_ReturnUrl: "http://localhost:3000/order/vnpay_return", // Đường dẫn trả về từ VNPAY
}; // config của VNPAY

// {PAYMENT} //
const getPayment = (req, res, next) => {
  const userId = req.body.userId; // Lấy id của user
  if (userId.toString() !== req.user._id.toString()) {
    // Nếu id của user không trùng với id của session user thì chuyển hướng về trang chủ
    return res.redirect("/"); // Chuyển hướng về trang chủ
  }
  // Ngược lại thì tiếp tục thực hiện thanh toán
  process.env.TZ = "Asia/Ho_Chi_Minh"; // Đặt múi giờ
  let date = new Date(); // Lấy thời gian hiện tại
  let createDate = moment(date).format("YYYYMMDDHHmmss"); // Định dạng thời gian hiện tại
  let ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress; // Lấy địa chỉ IP của user (nếu user dùng proxy thì sẽ lấy địa chỉ IP của proxy) - Nếu không có proxy thì sẽ lấy địa chỉ IP của user trực tiếp
  let tmnCode = config.vnp_TmnCode; // Mã website tại VNPAY
  let secretKey = config.vnp_HashSecret; // Chuỗi bí mật
  let vnpUrl = config.vnp_Url; // Đường dẫn thanh toán
  let returnUrl = config.vnp_ReturnUrl; // Đường dẫn trả về từ VNPAY
  let orderId = moment(date).format("DDHHmmss"); // Định dạng mã giao dịch
  let amount = parseFloat(req.body.amount); // Lấy số tiền thanh toán
  let currencyConverter = new CC({
    // Tạo 1 object để chuyển đổi tiền tệ
    from: "USD", // Tiền tệ đầu vào
    to: "VND", // Tiền tệ đầu ra
    amount: amount, // Số tiền cần chuyển đổi
    isDecimalComma: false, // Có sử dụng dấu phẩy để phân cách thập phân hay không
    isRounded: true, // Có làm tròn số hay không
    decimal: 2, // Số chữ số thập phân
    decimalSeparator: ".", // Dấu phân cách thập phân
    thousandSeparator: ",", // Dấu phân cách hàng nghìn
  });
  currencyConverter.convert().then((amount) => {
    // Chuyển đổi tiền tệ
    let currCode = "VND"; // Tiền tệ đầu ra
    let vnp_Params = {}; // Tạo 1 object để lưu các tham số
    vnp_Params["vnp_Version"] = "2.1.0"; // Phiên bản API
    vnp_Params["vnp_Command"] = "pay"; // Lệnh thanh toán
    vnp_Params["vnp_TmnCode"] = tmnCode; // Mã website tại VNPAY
    vnp_Params["vnp_Locale"] = "vn"; // Ngôn ngữ
    vnp_Params["vnp_CurrCode"] = currCode; // Tiền tệ đầu ra
    vnp_Params["vnp_TxnRef"] = orderId; // Mã giao dịch
    vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId; // Thông tin giao dịch
    vnp_Params["vnp_OrderType"] = "other"; // Loại hình thanh toán
    vnp_Params["vnp_Amount"] = amount * 100; // Số tiền thanh toán
    vnp_Params["vnp_ReturnUrl"] = returnUrl; // Đường dẫn trả về từ VNPAY
    vnp_Params["vnp_IpAddr"] = ipAddr; // Địa chỉ IP của user
    vnp_Params["vnp_CreateDate"] = createDate; // Thời gian tạo giao dịch
    vnp_Params = sortObject(vnp_Params); // Sắp xếp các tham số theo thứ tự a-z
    let signData = querystring.stringify(vnp_Params, { encode: false }); // Chuyển đổi object thành chuỗi query (không encode) - Để chuẩn bị mã hóa dữ liệu sau này
    let hmac = crypto.createHmac("sha512", secretKey); // Tạo 1 object để mã hóa dữ liệu
    let signed = hmac.update(new Buffer.from(signData, "utf-8")).digest("hex"); // Mã hóa dữ liệu
    vnp_Params["vnp_SecureHash"] = signed; // Thêm tham số mã hóa vào object
    vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false }); // Chuyển đổi object thành chuỗi query (không encode) - Để chuẩn bị chuyển hướng đến trang thanh toán
    res.redirect(vnpUrl); // Chuyển hướng đến trang thanh toán
  });
};

// Hàm sắp xếp các tham số theo thứ tự a-z
function sortObject(obj) {
  let sorted = {}; // Tạo 1 object để lưu các tham số đã sắp xếp
  let str = []; // Tạo 1 mảng để lưu các tham số chưa sắp xếp
  let key; // Tạo 1 biến để lưu tên tham số
  for (key in obj) {
    // Duyệt qua tất cả các tham số
    if (obj.hasOwnProperty(key)) {
      // Nếu tham số tồn tại
      str.push(encodeURIComponent(key)); // Thêm tên tham số vào mảng
    }
  }
  str.sort(); // Sắp xếp các tham số theo thứ tự a-z
  for (key = 0; key < str.length; key++) {
    // Duyệt qua tất cả các tham số đã sắp xếp
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+"); // Thêm tham số đã sắp xếp vào object và thay thế dấu cách bằng dấu "+" (Vì khi mã hóa dữ liệu, dấu cách sẽ bị thay thế bằng dấu "+")
  }
  return sorted; // Trả về object các tham số đã sắp xếp
}

module.exports = {
  getPayment,
};
