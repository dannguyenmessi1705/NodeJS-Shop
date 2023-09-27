const Product = require("../../models/products");
const fs = require("fs");

// {DEFINE THE NUMBER OF PER PAGE} //
const productOfPage = 6;

// {VALIDATION INPUT} //
const { validationResult } = require("express-validator");

// {CREAT PRODUCT BY MONGOOSE} //
const postProduct = async (req, res, next) => {
  /*#swagger.tags = ['Admin']
    #swagger.description = 'Endpoint to create a new product'
    #swagger.security = [{
      "csrfToken": [],
      "bearAuth": []
    }]
    #swagger.requestBody = {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            "type": "object",
            "properties": {
              "name": {
                "type": "string",
                "example": "Iphone 12"
              },
              "price": {
                "type": "number",
                "example": 1000
              },
              "image": {
                "type": "string",
                "format": "binary"
              },
              "description": {
                "type": "string",
                "example": "A smartphone from Apple"
              }
            },
            "required": [
              "name",
              "price",
              "image",
              "description"
            ]
          }
        }
      }
    }
  */
  const name = req.body.name;
  let price = req.body.price;
  if (price.includes(",")) {
    // Nếu giá trị nhập vào có dấu "," thì thay thế bằng "."
    price = price.replace(",", ".");
  }
  const image = req.file; // Lấy file từ multer
  if (!image) {
    // Nếu không có file thì trả về trang add-product với thông báo lỗi
    return res.status(422).json({
      message: "Attached file is not an image",
      title: "Add Product",
      path: "/admin/add-product",
      editing: false,
      error: undefined,
      errorType: undefined, //  Xác định trường nào chứa giá trị lỗi
      oldInput: {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        quantity: req.body.quantity,
      }, // Lưu lại các giá trị vừa nhập
    });
  }
  const description = req.body.description;
  const quantity = req.body.quantity;
  const userId = req.user._id;
  // VALIDATION INPUT
  const errorValidation = validationResult(req);
  if (!errorValidation.isEmpty()) {
    console.log(errorValidation.array());
    const [error] = errorValidation.array();
    return res.status(422).json({
      message: error.msg,
      title: "Add Product",
      path: "/admin/add-product",
      editing: false,
      errorType: error.path, //  Xác định trường nào chứa giá trị lỗi
      oldInput: {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        quantity: req.body.quantity,
      }, // Lưu lại các giá trị vừa nhập
    });
  }
  try {
    const product = new Product({
      name,
      price,
      url: image.path, // Lấy đường dẫn của file từ multer (đường dẫn này phải được khai báo dạng tĩnh)
      description,
      quantity,
      userId,
    });
    const result = await product.save();
    if (result) {
      res.status(201).json({ message: "Create product successfull", product });
    } else {
      res.status(500).json({ message: "Create product failed" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// {GET ALL PRODUCTS BY MONGOOSE} //
const getProduct = async (req, res, next) => {
  /*#swagger.tags = ['Admin']
    #swagger.description = 'Endpoint to get products'
    #swagger.security = [{
      "bearAuth": []
    }]
    #swagger.parameters['page'] = {
      in: 'query',
      description: 'Page number',
      required: false,
      type: 'integer'
    }
  */

  /// {PAGINATION} ///
  const curPage = +req.query.page || 1; // Lấy giá trị của query 'page' từ URL, nếu không có thì mặc định là 1
  let numProducts; // Khai báo biến để lưu số lượng sản phẩm
  try {
    // {AUTHORIZATION} //
    const numOfProducts = await Product.countDocuments({
      userId: req.user._id,
    }); // Đếm số lượng sản phẩm trong database (userId: req.user._id) - Chỉ đếm số lượng sản phẩm của user đang đăng nhập
    numProducts = +numOfProducts; // Lưu số lượng sản phẩm vào biến numProducts
    // {AUTHORIZATION} //
    const products = await Product.find({ userId: req.user._id }) // Tìm tất cả sản phẩm trong database (userId: req.user._id) - Chỉ tìm sản phẩm của user đang đăng nhập
      .skip((curPage - 1) * productOfPage) // Bỏ qua các sản phẩm trước sản phẩm hiện tại (curPage - 1) * productOfPage
      .limit(productOfPage) // Giới hạn số lượng sản phẩm trên 1 trang
      .select("name price url description _id soldQuantity quantity") // Chỉ lấy các thuộc tính name, price, url, description, bỏ thuộc tính _id
      .exec(); // Thực thi
    if (!products) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({
      message: "Get products successfull",
      title: "Admin Product",
      items: products,
      path: "/admin/product",
      // {PAGINATION} //
      lastPage: Math.ceil(numProducts / productOfPage), // Tính số lượng trang
      curPage: curPage, // Trang hiện tại
      nextPage: curPage + 1, // Trang tiếp theo
      prevPage: curPage - 1, // Trang trước
      hasPrevPage: curPage > 1, // Kiểm tra xem có trang trước hay không
      hasNextPage: curPage < Math.ceil(numProducts / productOfPage), // Kiểm tra xem có trang tiếp theo hay không
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// {GET EDIT PRODUCT BY MONGOOSE} //
const getEditProduct = async (req, res, next) => {
  /*#swagger.tags = ['Admin']
    #swagger.description = 'Endpoint to get edit product'
    #swagger.security = [{
      "bearAuth": []
    }]
    #swagger.parameters['edit'] = {
      in: 'query',
      description: 'Edit product',
      required: false,
      type: 'boolean'
    }
    #swagger.parameters['productID'] = {
      in: 'path',
      description: 'Product ID',
      required: true,
      type: 'string'
    }
  */
  const isEdit = req.query.edit;
  if (!isEdit) {
    return res.redirect("/");
  }
  const ID = req.params.productID; // // Lấy route động :productID bên routes (URL) - VD: http://localhost:3000/product/0.7834371053383911 => ID = 0.7834371053383911
  try {
    const product = await Product.findById(ID);
    if (product.userId.toString() !== req.user._id.toString()) {
      // Kiểm tra xem user hiện tại có phải là người tạo ra product này hay không
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(308).json({
      message: "Go to edit product page",
      title: "Edit Product",
      path: "/admin/add-product",
      editing: isEdit, // truyền giá trị của query 'edit' vào biến editing để kiểm tra xem có phải đang ở trạng thái edit hay không
      item: product, // gán product vừa tìm được vào biến item để đưa vào file ejs
      error: undefined,
      errorType: undefined, //  ban đầu chưa có giá trị nào lỗi
      oldInput: {
        name: "",
        price: "",
        description: "",
        quantity: "",
      }, // Lưu lại các giá trị vừa nhập (vì ban đầu không có giá trị nào trong trường cả)
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// {UPDATE PRODUCT BY MONGOOSE} //
const postEditProduct = async (req, res, next) => {
  /*#swagger.tags = ['Admin']
    #swagger.description = 'Endpoint to update product'
    #swagger.security = [{
      "csrfToken": [],
      "bearAuth": []
    }]
    #swagger.requestBody = {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            "type": "object",
            "properties": {
              "name": {
                "type": "string",
                "example": "Iphone 12"
              },
              "price": {
                "type": "number",
                "example": 1000
              },
              "image": {
                "type": "string",
                "format": "binary"
              },
              "description": {
                "type": "string",
                "example": "A smartphone from Apple"
              }
            },
            "required": [
              "name",
              "price",
              "description"
            ]
          }
        }
      }
    }
    #swagger.parameters['edit'] = {
      in: 'query',
      description: 'Edit product',
      required: false,
      type: 'boolean'
    }
    #swagger.parameters['productID'] = {
      in: 'path',
      description: 'Product ID',
      required: true,
      type: 'string'
    }
  */
  const name = req.body.name;
  let price = req.body.price;
  if (price.includes(",")) {
    // Nếu giá trị nhập vào có dấu "," thì thay thế bằng "."
    price = price.replace(",", ".");
  }
  const image = req.file; // Lấy file từ multer
  let url = undefined; // Khai báo biến url để lưu đường dẫn của file
  if (image) {
    // Nếu có file thì lưu đường dẫn của file vào biến url
    url = image.path; // Lấy đường dẫn của file từ multer (đường dẫn này phải được khai báo dạng tĩnh)
  }
  const description = req.body.description;
  const quantity = req.body.quantity;
  const ID = req.params.productID;
  // const ID = req.body.id; // ".id" vì id được đặt trong thuộc tính name của thẻ input đã được hidden
  // VALIDATION INPUT
  const errorValidation = validationResult(req);
  try {
    const product = await Product.findById(ID);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    // VALIDATION INPUT
    if (!errorValidation.isEmpty()) {
      console.log(errorValidation.array());
      const [error] = errorValidation.array();
      return res.status(422).json({
        message: error.msg,
        title: "Edit Product",
        path: "/admin/add-product",
        editing: true, // truyền giá trị của query 'edit' vào biến editing để kiểm tra xem có phải đang ở trạng thái edit hay không
        item: product,
        error: error.msg,
        errorType: error.path, //  Xác định trường nào chứa giá trị lỗi
        oldInput: {
          name,
          price,
          description,
          quantity,
        }, // Lưu lại các giá trị vừa nhập
      });
    }
    // {AUTHORIZATION} //
    if (product.userId.toString() !== req.user._id.toString()) {
      // Kiểm tra xem user hiện tại có phải là người tạo ra product này hay không
      return res.status(403).json({ message: "Forbidden" });
    }
    // Cập nhật lại các giá trị của product theo req.body
    product.name = name;
    product.price = price;
    if (url) {
      // Nếu có file thì lưu đường dẫn của file vào biến url
      fs.unlink(product.url, (err) => {
        // Xóa file cũ
        if (err) {
          return res.status(500).json({ message: "Server error" });
        }
      });
      product.url = url; // Lưu đường dẫn của file mới
    }
    product.description = description;
    product.quantity = quantity;
    // Lưu lại vào database
    const result = await product.save();
    if (result) {
      res.status(201).json({ message: "Update product successfull", product });
    } else {
      res.status(500).json({ message: "Update product failed" });
    }
    // Muốn nhanh hơn thì dùng method findByIdAndUpdate, ruy nhiên dùng save() có thể dùng được với middleware
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// {DELETE PRODUCT BY MONGOOSE} //
const deleteProduct = async (req, res, next) => {
  /*#swagger.tags = ['Admin']
    #swagger.description = 'Endpoint to delete product'
    #swagger.security = [{
      "csrfToken": [],
      "bearAuth": []
    }]
    #swagger.parameters['productID'] = {
      in: 'path',
      description: 'Product ID',
      required: true,
      type: 'string'
    }
  */
 
  const ID = req.params.productID; // // Lấy route động :productID bên routes (URL) - VD: http://localhost:3000/product/0.7834371053383911 => ID = 0.7834371053383911
  // Vì không phải load lại trang nên không dùng method POST của form => không thể dùng req.body
  // Xoá sản phẩm trong database thì phải xoá file ảnh trong folder images (tiết kiệm ổ cứng)
  let urlDelete; // Khai báo biến url để lưu đường dẫn của file
  try {
    const product = await Product.findById(ID);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    urlDelete = product.url; // Lưu đường dẫn của file vào biến urlDelete
    // {AUTHORIZATION} //
    const result = await Product.deleteOne({ _id: ID, userId: req.user._id }); // Kiểm tra xem user hiện tại có phải là người tạo ra product này hay không (userId: req.user._id)
    if (!result) {
      return res.status(403).json({ message: "Forbidden" });
    }
    fs.unlink(urlDelete, (err) => {
      // Xóa file cũ
      if (err) {
        // Nếu có lỗi thì in ra lỗi
        return res.status(500).json({ message: "Server error" });
      }
    });
    // Xoá cả sản phẩm nếu có trong giỏ hàng
    req.user.cart.items = req.user.cart.items.filter((item) => {
      return item.productId.toString() !== ID.toString();
    });
    const save = await req.user.save();
    if (!save) {
      return res.status(500).json({ message: "Server error" });
    }
    res.status(200).json({ message: "Delete successfull", product }); // Trả về kết quả là json với message là Delete successfull
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
module.exports = {
  postProduct,
  getProduct,
  getEditProduct,
  postEditProduct,
  deleteProduct,
};
