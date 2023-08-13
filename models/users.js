const mongoose = require("mongoose"); // Nhập module mongoose
const SchemaTypes = mongoose.SchemaTypes; // Nhập module SchemaTypes từ mongoose để sử dụng các kiểu dữ liệu trong Schema
const Schema = mongoose.Schema; // Nhập module Schema từ mongoose để tạo Schema cho collection
const User = new Schema({
  username: {
    type: SchemaTypes.String,
    required: true,
  },
  email: {
    type: SchemaTypes.String,
    required: true,
  },
  password: {
    type: SchemaTypes.String,
    required: true,
  },
  resetPasswordToken: SchemaTypes.String,
  resetPasswordExpires: SchemaTypes.Date,
  cart: {
    items: [
      {
        productId: {
          type: SchemaTypes.ObjectId,
          ref: "products", // {Realation} //
        },
        quantity: {
          type: SchemaTypes.Number,
        },
      },
    ],
  },
});
// {ADD TO CART BY USER IN MONGOOSE} //
// Tạo method postCartByUser cho User (this ở đây chính là object user được tạo ra từ class User)
User.methods.postCartByUser = function (product) {
  // Dùng declaring function, vì có thể dùng được với this
  let newQuantity = 1; // Khởi tạo biến lưu số lượng product
  const cartIndex = this.cart.items.findIndex((item) => {
    // Tìm kiếm product trong cart có id trùng với id của product được truyền vào
    return item.productId.toString() === product._id.toString(); // Dùng toString() để so sánh 2 string vì ban đầu item.productId, product._id là object
  });
  let cartUpdate = [...this.cart.items]; // Tạo một array mới bằng cách copy từ array cũ
  if (cartIndex >= 0) {
    // Nếu tìm thấy product trong cart
    newQuantity = cartUpdate[cartIndex].quantity + 1; // Tăng số lượng product lên 1
    cartUpdate[cartIndex].quantity = newQuantity; // Cập nhật lại số lượng product trong cart
  } else {
    // Nếu không tìm thấy product trong cart
    cartUpdate.push({
      // Thêm product vào cart
      productId: product._id, // Lấy id của product được truyền vào
      quantity: newQuantity, // Số lượng product
    });
  }
  const Update = {
    //   Tạo object Update để cập nhật cart
    items: cartUpdate,
  };
  this.cart = Update; // Cập nhật lại cart của user
  return this.save(); // Lưu lại vào database
};

// {DELETE CART BY USER IN MONGOOSE} //
// Tạo method postCartByUser cho User (this ở đây chính là object user được tạo ra từ class User)
User.methods.deleteCartByUser = function (product) {
  // Dùng declaring function, vì có thể dùng được với this
  const cartIndex = this.cart.items.findIndex((item) => {
    // Tìm kiếm product trong cart có id trùng với id của product được truyền vào
    return item.productId.toString() === product._id.toString(); // Dùng toString() để so sánh 2 string vì ban đầu item.productId, product._id là object
  });
  let updateCart = [...this.cart.items]; // Tạo một array mới bằng cách copy từ array cũ (this.cart.items)
  if (cartIndex >= 0) {
    // Nếu tìm thấy product trong cart
    updateCart.splice(cartIndex, 1); // Xoá product trong cart
  }
  const Update = {
    items: updateCart, // Tạo object Update để cập nhật cart
  };
  this.cart = Update; //  Cập nhật lại cart của user
  return this.save(); // Lưu lại vào database
};

// {Xoá CART SAU KHI ORDER} //
User.methods.clearCart = function () {
  this.cart.items = [];
  return this.save();
};

module.exports = mongoose.model("users", User); // Tạo collection users trong database và export ra để sử dụng
