const mongoose = require("mongoose"); // Nhập mongoose lấy từ module mongoose
const Schema = mongoose.Schema; // Nhập Schema lấy từ mongoose
const SchemaTypes = mongoose.SchemaTypes; // Nhập SchemaTypes lấy từ mongoose
// Tạo Schema cho product
const Product = new Schema({
  name: {
    type: SchemaTypes.String, // Kiểu dữ liệu
    required: true, // Bắt buộc phải có
  },
  price: {
    type: SchemaTypes.Number, // Kiểu dữ liệu
    required: true, // Bắt buộc phải có
  },
  url: {
    type: SchemaTypes.String, // Kiểu dữ liệu
    required: true, // Bắt buộc phải có
  },
  description: {
    type: SchemaTypes.String, // Kiểu dữ liệu
    require: true, // Bắt buộc phải có
  },
  soldQuantity: {
    type: SchemaTypes.Number, // Kiểu dữ liệu
    default: 0, // Giá trị mặc định
  },
  // {Realation} //
  userId: {
    type: SchemaTypes.ObjectId,
    required: true,
    ref: "users",
  },
});

module.exports = mongoose.model("products", Product); // Tạo model products vào collection từ Schema Product và export ra ngoài để sử dụng
