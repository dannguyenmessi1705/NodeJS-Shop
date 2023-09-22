const Product = require("../models/products");
const fs = require("fs");

// {DEFINE THE NUMBER OF PER PAGE} //
const productOfPage = 6;

// {VALIDATION INPUT} //
const { validationResult } = require("express-validator");

// {ADD PRODUCT PAGE} //
const addProduct = async (req, res, next) => {
  res.render("./admin/editProduct", {
    title: "Add Product",
    path: "/admin/add-product",
    editing: false, // Phân biệt với trạng thái Edit vs Add Product
    error: undefined,
    errorType: undefined, //  ban đầu chưa có giá trị nào lỗi
    oldInput: {
      name: "",
      price: "",
      description: "",
    }, // Lưu lại các giá trị vừa nhập (vì ban đầu không có giá trị nào trong trường cả)
  });
};

// {CREAT PRODUCT BY MONGOOSE} //
const postProduct = async (req, res, next) => {
  const name = req.body.name;
  let price = req.body.price;
  if (price.includes(",")) {
    // Nếu giá trị nhập vào có dấu "," thì thay thế bằng "."
    price = price.replace(",", ".");
  }
  const image = req.file; // Lấy file từ multer
  if (!image) {
    // Nếu không có file thì trả về trang add-product với thông báo lỗi
    return res.status(422).render("./admin/editProduct", {
      title: "Add Product",
      path: "/admin/add-product",
      editing: false,
      error: undefined,
      errorType: undefined, //  Xác định trường nào chứa giá trị lỗi
      oldInput: {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
      }, // Lưu lại các giá trị vừa nhập
    });
  }
  const description = req.body.description;
  const userId = req.user._id;
  // VALIDATION INPUT
  const errorValidation = validationResult(req);
  if (!errorValidation.isEmpty()) {
    console.log(errorValidation.array());
    const [error] = errorValidation.array();
    return res.status(422).render("./admin/editProduct", {
      title: "Add Product",
      path: "/admin/add-product",
      editing: false,
      error: error.msg,
      errorType: error.path, //  Xác định trường nào chứa giá trị lỗi
      oldInput: {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
      }, // Lưu lại các giá trị vừa nhập
    });
  }
  try {
    const product = new Product({
      name,
      price,
      url: image.path, // Lấy đường dẫn của file từ multer (đường dẫn này phải được khai báo dạng tĩnh)
      description,
      userId,
    });
    const result = await product.save();
    if (result) {
      console.log("Created Product");
      res.redirect("/admin/product");
    } else {
      const err = new Error("Create product failed");
      err.httpStatusCode = 500;
      throw err;
    }
  } catch (err) {
    // {ERROR MIDDLEWARE} //
    if (!err.httpStatusCode) {
      err.httpStatusCode = 500;
    }
    next(err);
  }
};

// {GET ALL PRODUCTS BY MONGOOSE} //
const getProduct = async (req, res, next) => {
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
      .select("name price url description _id soldQuantity") // Chỉ lấy các thuộc tính name, price, url, description, bỏ thuộc tính _id
      .exec(); // Thực thi
    if (!products) {
      const err = new Error("Product not found");
      err.httpStatusCode = 404;
      throw err;
    }
    res.render("./admin/products", {
      title: "Admin Product",
      items: products,
      path: "/admin/product",
      accessToken: req.session.accessToken,
      // {PAGINATION} //
      lastPage: Math.ceil(numProducts / productOfPage), // Tính số lượng trang
      curPage: curPage, // Trang hiện tại
      nextPage: curPage + 1, // Trang tiếp theo
      prevPage: curPage - 1, // Trang trước
      hasPrevPage: curPage > 1, // Kiểm tra xem có trang trước hay không
      hasNextPage: curPage < Math.ceil(numProducts / productOfPage), // Kiểm tra xem có trang tiếp theo hay không
    });
  } catch (err) {
    // {ERROR MIDDLEWARE} //
    if (!err.httpStatusCode) {
      err.httpStatusCode = 500;
    }
    next(err);
  }
};

// {GET EDIT PRODUCT BY MONGOOSE} //
const getEditProduct = async (req, res, next) => {
  const isEdit = req.query.edit;
  if (!isEdit) {
    return res.redirect("/");
  }
  const ID = req.params.productID; // // Lấy route động :productID bên routes (URL) - VD: http://localhost:3000/product/0.7834371053383911 => ID = 0.7834371053383911
  try {
    const product = await Product.findById(ID);
    if (product.userId.toString() !== req.user._id.toString()) {
      // Kiểm tra xem user hiện tại có phải là người tạo ra product này hay không
      return res.redirect("/admin/product"); // Nếu không phải thì redirect về trang chủ
    }
    if (!product) {
      const err = new Error("Product not found");
      err.httpStatusCode = 404;
      throw err;
    }
    res.render("./admin/editProduct", {
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
      }, // Lưu lại các giá trị vừa nhập (vì ban đầu không có giá trị nào trong trường cả)
    });
  } catch (err) {
    if (!err.httpStatusCode) {
      err.httpStatusCode = 500;
    }
  }
};

// {UPDATE PRODUCT BY MONGOOSE} //
const postEditProduct = async (req, res, next) => {
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
  const ID = req.body.id; // ".id" vì id được đặt trong thuộc tính name của thẻ input đã được hidden
  // VALIDATION INPUT
  const errorValidation = validationResult(req);
  try {
    const product = await Product.findById(ID);
    if (!product) {
      const err = new Error("Product not found");
      err.httpStatusCode = 404;
      throw err;
    }
    // VALIDATION INPUT
    if (!errorValidation.isEmpty()) {
      console.log(errorValidation.array());
      const [error] = errorValidation.array();
      return res.status(422).render("./admin/editProduct", {
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
        }, // Lưu lại các giá trị vừa nhập
      });
    }
    // {AUTHORIZATION} //
    if (product.userId.toString() !== req.user._id.toString()) {
      // Kiểm tra xem user hiện tại có phải là người tạo ra product này hay không
      return res.redirect("/"); // Nếu không phải thì redirect về trang chủ
    }
    // Cập nhật lại các giá trị của product theo req.body
    product.name = name;
    product.price = price;
    if (url) {
      // Nếu có file thì lưu đường dẫn của file vào biến url
      fs.unlink(product.url, (err) => {
        // Xóa file cũ
        if (err) {
          // Nếu có lỗi thì in ra lỗi
          console.log(err);
          next(new Error(err));
        }
      });
      product.url = url; // Lưu đường dẫn của file mới
    }
    product.description = description;
    // Lưu lại vào database
    const result = await product.save();
    if (result) {
      console.log("Updated!");
      res.redirect("/admin/product");
    } else {
      const err = new Error("Update product failed");
      err.httpStatusCode = 500;
      throw err;
    }
    // Muốn nhanh hơn thì dùng method findByIdAndUpdate, ruy nhiên dùng save() có thể dùng được với middleware
  } catch (err) {
    if (!err.httpStatusCode) {
      err.httpStatusCode = 500;
    }
    next(err);
  }
};

// {DELETE PRODUCT BY MONGOOSE} //
const deleteProduct = async (req, res, next) => {
  const ID = req.params.productID; // // Lấy route động :productID bên routes (URL) - VD: http://localhost:3000/product/0.7834371053383911 => ID = 0.7834371053383911
  // Vì không phải load lại trang nên không dùng method POST của form => không thể dùng req.body
  // Xoá sản phẩm trong database thì phải xoá file ảnh trong folder images (tiết kiệm ổ cứng)
  let urlDelete; // Khai báo biến url để lưu đường dẫn của file
  try {
    const product = await Product.findById(ID);
    if (!product) {
      const err = new Error("Product not found");
      err.httpStatusCode = 404;
      throw err;
    }
    urlDelete = product.url; // Lưu đường dẫn của file vào biến urlDelete
    // {AUTHORIZATION} //
    const result = await Product.deleteOne({ _id: ID, userId: req.user._id }); // Kiểm tra xem user hiện tại có phải là người tạo ra product này hay không (userId: req.user._id)
    if (!result) {
      const err = new Error("Delete failed");
      err.httpStatusCode = 404;
      throw err;
    }
    fs.unlink(urlDelete, (err) => {
      // Xóa file cũ
      if (err) {
        // Nếu có lỗi thì in ra lỗi
        console.log(err);
        throw err;
      }
    });
    // Xoá cả sản phẩm nếu có trong giỏ hàng
    req.user.cart.items = req.user.cart.items.filter((item) => {
      return item.productId.toString() !== ID.toString();
    });
    const save = await req.user.save();
    if (!save) {
      const err = new Error("Delete failed");
      err.httpStatusCode = 404;
      throw err;
    }
    console.log("Deleted!");
    res.status(200).json({ message: "Delete successfull" }); // Trả về kết quả là json với message là Delete successfull
  } catch (err) {
    if (!err.httpStatusCode) {
      err.httpStatusCode = 500;
    }
    next(err);
  }
};
module.exports = {
  addProduct,
  postProduct,
  getProduct,
  getEditProduct,
  postEditProduct,
  deleteProduct,
};
