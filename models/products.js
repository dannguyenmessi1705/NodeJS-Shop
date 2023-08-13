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
  // {Realation} //
  userId: {
    type: SchemaTypes.ObjectId,
    required: true,
    ref: "users",
  },
});

module.exports = mongoose.model("products", Product); // Tạo model products vào collection từ Schema Product và export ra ngoài để sử dụng

/* 11. MongoDB
const getDB = require("../util/database").getDB; // Nhập vào object getDB lấy từ file database.js
const { ObjectId } = require("mongodb");
// Tạo class Product
class Product {
  constructor(name, price, url, description, userID) {
    (this.name = name),
      (this.price = price),
      (this.url = url),
      (this.description = description),
      (this.userID = userID); // Lưu id của user tạo product
  }
  // Lưu product vào database
  save(productID = null) { // Tham số productID có giá trị mặc định là null
    const db = getDB(); // Lấy database từ server MongoDB (xử lý trong file database.js)
    let dbOP; // Biến lưu trữ database operation
    // Nếu có tham số productID truyền vào => update
    if (productID) {
      const ID = new ObjectId(productID) // Tạo object ID từ string productID (vì productID là string, còn ID là object)
      dbOP = db.collection("products").updateOne({ _id: ID }, { $set: this }) // Lấy collection products trong database, tìm kiếm product có id là ID, và update product đó bằng object this (this ở đây chính là object product được tạo ra từ class Product)
    }
    // Nếu không có tham số productID truyền vào => tạo mới
    else {
      dbOP = db.collection("products").insertOne(this); // Lấy collection products trong database (nếu chưa có sẽ tự động tạo mới) và Thêm product vào collection products (this ở đây chính là object product được tạo ra từ class Product)
    }
    return dbOP.then((result) => console.log(result)).catch((err) => console.log(err)); // Trả về kết quả thực hiện database operation
  }
  // Lấy tất cả product từ database
  static fetchAll() {
    const db = getDB(); // Lấy database từ server MongoDB (xử lý trong file database.js)
    return db
      .collection("products") // Lấy collection products trong database (nếu chưa có sẽ tự động tạo mới)
      .find() // Tìm kiếm tất cả product trong collection products
      .toArray() // Sau khi tìm kiếm xong, chuyển kết quả thành array (vì kết quả trả về là 1 cursor object, không phải là array)
      .then((result) => {
        console.log(result);
        return result;
      })
      .catch((err) => console.log(err));
  }
  // Tìm kiếm product theo id
  static findById(productID) {
    const db = getDB(); // Lấy database từ server MongoDB (xử lý trong file database.js)
    const ID = new ObjectId(productID); // Tạo object ID từ string productID (vì productID là string, còn ID là object)
    return (
      db
        .collection("products") // Lấy collection products trong database (nếu chưa có sẽ tự động tạo mới)
        .findOne({ _id: ID }) // Tìm kiếm product trong collection products có id là ID (Nếu muốn trả về object không cần next() thì dùng findOne())
        // .next() // Sau khi tìm kiếm xong, chuyển kết quả thành object (vì kết quả trả về là 1 cursor object, không phải là object)
        .then((result) => {
          console.log(result);
          return result;
        })
        .catch((err) => console.log(err))
    );
  }
  // Xóa product theo id
  static deleteById(productID) {
    const db = getDB() // Lấy database từ server MongoDB (xử lý trong file database.js)
    const ID = new ObjectId(productID) // Tạo object ID từ string productID (vì productID là string, còn ID là object)
    return db.collection("products").deleteOne({ _id: ID }) // Tìm kiếm product trong collection, có id là ID rồi xoá product đó
    .then(result => console.log(result))
    .catch(err => console.log(err))
  }
}
module.exports = Product;
*/
