const moment = require("moment"); // module để xử lý thời gian
const crypto = require("crypto"); // module để mã hóa dữ liệu
const CC = require("currency-converter-lt"); // module để chuyển đổi tiền tệ
const querystring = require("qs"); // module để chuyển đổi object thành chuỗi query
const config = {
  vnp_TmnCode: "54FXX7NZ", // Mã website tại VNPAY
  vnp_HashSecret: "EIFPXFPSHZGYLFHEWJJIBJSESLERCVDW", // Chuỗi bí mật
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html", // Đường dẫn thanh toán
  vnp_Api: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction", // Đường dẫn API
  vnp_ReturnUrl: "http://localhost:3000/payment/vnpay_return", // Đường dẫn trả về từ VNPAY
}; // config của VNPAY

// {PAYMENT} // Thu nhập thông tin từ client và chuyển hướng đến API trang thanh toán
const getPayment = (req, res, next) => {
  // const userId = req.body.userId; // Lấy id của user
  const userId = req.params.userID; // Lấy id của user từ params route (API)
  if (userId !== req.user._id.toString()) {
    // Nếu id của user không trùng với id của session user thì chuyển hướng về trang chủ
    return res.status(403).json({ message: "Forbiden" });
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
  // let returnUrl = config.vnp_ReturnUrl; // Đường dẫn trả về từ VNPAY
  let returnUrl =
    req.protocol + "://" + req.get("host") + "/payment/vnpay_return/"; // Lấy đường dẫn trang mặc định (http://localhost:3000); // Đường dẫn
  // let returnUrl = config.vnp_ReturnUrl; // Đường dẫn trả về từ VNPAY
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
    vnp_Params["vnp_Amount"] = Math.ceil(amount * 100); // Số tiền thanh toán (amount*100 để chuyển đổi từ VND sang xu - tất cả API thanh toán đều làm việc như vậy), ngoài ra phải làm tròn số vì API thanh toán chỉ nhận số nguyên
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

// CHUYỂN HƯỚNG TỚI TRANG TRẢ VỀ KẾT QUẢ THANH TOÁN //
const VNPayReturn = async (req, res, next) => {
  try {
    let vnp_Params = req.query; // Lấy các tham số trả về từ VNPAY (đã được chuyển đổi thành object) - Để chuẩn bị kiểm tra mã hóa
    let secureHash = vnp_Params["vnp_SecureHash"]; // Lấy tham số mã hóa từ VNPAY
    delete vnp_Params["vnp_SecureHash"]; // Xóa tham số mã hóa để chuẩn bị kiểm tra mã hóa
    delete vnp_Params["vnp_SecureHashType"]; // Xóa tham số loại mã hóa (SHA256 hoặc SHA512) - Vì chúng ta đã định nghĩa mã hóa là SHA512 ở config

    vnp_Params = sortObject(vnp_Params); // Sắp xếp các tham số theo thứ tự a-z (trước khi kiểm tra mã hóa)

    let tmnCode = config.vnp_TmnCode; // Mã website tại VNPAY
    let secretKey = config.vnp_HashSecret; // Chuỗi bí mật

    let signData = querystring.stringify(vnp_Params, { encode: false }); // Chuyển đổi object thành chuỗi query (không encode) - Để chuẩn bị mã hóa dữ liệu sau này
    let hmac = crypto.createHmac("sha512", secretKey); // Tạo 1 object để mã hóa dữ liệu (SHA512)
    let signed = hmac.update(new Buffer.from(signData, "utf-8")).digest("hex"); // Mã hóa dữ liệu

    if (secureHash === signed && vnp_Params["vnp_ResponseCode"] == "00") {
      // Nếu mã hóa trả về từ VNPAY trùng với mã hóa của chúng ta
      //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
      // {SAVE ORDER AND DELETE CART} //
      const Order = require("../models/orders"); // Gọi model order
      const user = await req.user.populate("cart.items.productId"); // Lấy tất cả dữ liệu user, populate để lấy thêm dữ liệu từ collection products vào thuộc tính productId của cart
      const products = [...user.cart.items]; // Sau khi lấy được dữ liệu từ collection products qua populate, copy lại vào biến products
      const productArray = products.map((item) => {
        // Tạo mảng mới chứa các object product và quantity
        return {
          product: item.productId._doc, // _doc là thuộc tính của mongoose, nó sẽ lấy ra tất cả các thuộc tính của object productId
          quantity: item.quantity, // Lấy quantity từ cart
        };
      });
      const order = new Order({
        // Tạo order mới
        products: productArray,
        user: {
          username: req.user.username,
          email: req.user.email,
          userId: req.user._id,
        },
        date: new Date().toLocaleString(),
      });
      await order.save(); // Lưu order vào database
      await req.user.clearCart(); // Xoá cart của user
      res.status(308).json({
        message: "Payment Success",
        title: "Payment Success",
        path: "/checkout",
        code: vnp_Params["vnp_ResponseCode"],
      }); // Trả về trang vnpayReturn và truyền mã code trả về từ VNPAY (GD thành công))
    } else {
      // Nếu mã hóa trả về từ VNPAY không trùng với mã hóa của chúng ta
      res.status(404).json({
        message: "Payment Failed",
        title: "Payment Failed",
        path: "/checkout",
        code: "97",
      }); // Trả về trang vnpayReturn và truyền mã code = 97 (GD thất bại)
    }
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Hàm sắp xếp các tham số theo thứ tự a-z
function sortObject(obj) {
  let sorted = {}; // Tạo 1 object để lưu các tham số đã sắp xếp
  let str = []; // Tạo 1 mảng để lưu các tham số chưa sắp xếp
  let key; // Tạo 1 biến để lưu tên tham số
  for (key in obj) {
    // Duyệt qua tất cả các tham số
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
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
  VNPayReturn,
};
