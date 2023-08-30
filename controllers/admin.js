const products = require("../models/products");
const Product = require("../models/products");
const fs = require("fs");

// {DEFINE THE NUMBER OF PER PAGE} //
const productOfPage = 6;

// {VALIDATION INPUT} //
const { validationResult } = require("express-validator");

// {ADD PRODUCT PAGE} //
const addProduct = (req, res, next) => {
  res.render("./admin/editProduct", {
    title: "Add Product",
    path: "/admin/add-product",
    hasFooter: false,
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
const postProduct = (req, res, next) => {
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
      hasFooter: false,
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
      hasFooter: false,
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
  const product = new Product({
    name,
    price,
    url: image.path, // Lấy đường dẫn của file từ multer (đường dẫn này phải được khai báo dạng tĩnh)
    description,
    userId,
  });
  return product
    .save()
    .then((result) => {
      console.log("Created Product");
      res.redirect("/admin/product");
    })
    .catch((err) => {
      // {ERROR MIDDLEWARE} //
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

// {GET ALL PRODUCTS BY MONGOOSE} //
const getProduct = (req, res, next) => {
  /// {PAGINATION} ///
  const curPage = +req.query.page || 1; // Lấy giá trị của query 'page' từ URL, nếu không có thì mặc định là 1
  let numProducts; // Khai báo biến để lưu số lượng sản phẩm
  // {AUTHORIZATION} //
  Product.countDocuments({ userId: req.user._id }) // Đếm số lượng sản phẩm trong database (userId: req.user._id) - Chỉ đếm số lượng sản phẩm của user đang đăng nhập
    .then((numOfProducts) => {
      numProducts = +numOfProducts; // Lưu số lượng sản phẩm vào biến numProducts
      // {AUTHORIZATION} //
      Product.find({ userId: req.user._id }) // Tìm tất cả sản phẩm trong database (userId: req.user._id) - Chỉ tìm sản phẩm của user đang đăng nhập
        .skip((curPage - 1) * productOfPage) // Bỏ qua các sản phẩm trước sản phẩm hiện tại (curPage - 1) * productOfPage
        .limit(productOfPage) // Giới hạn số lượng sản phẩm trên 1 trang
        .select("name price url description _id") // Chỉ lấy các thuộc tính name, price, url, description, bỏ thuộc tính _id
        .exec() // Chỉ lấy các thuộc tính name, price, url, description, bỏ thuộc tính _id
        .then((products) => {
          res.render("./admin/products", {
            title: "Admin Product",
            items: products,
            path: "/admin/product",
            hasFooter: false,
            // {PAGINATION} //
            lastPage: Math.ceil(numProducts / productOfPage), // Tính số lượng trang
            curPage: curPage, // Trang hiện tại
            nextPage: curPage + 1, // Trang tiếp theo
            prevPage: curPage - 1, // Trang trước
            hasPrevPage: curPage > 1, // Kiểm tra xem có trang trước hay không
            hasNextPage: curPage < Math.ceil(numProducts / productOfPage), // Kiểm tra xem có trang tiếp theo hay không
          });
        })
        .catch((err) => {
          // {ERROR MIDDLEWARE} //
          const error = new Error(err);
          error.httpStatusCode = 500;
          next(error);
        });
    })
    .catch((err) => {
      // {ERROR MIDDLEWARE} //
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

// {GET EDIT PRODUCT BY MONGOOSE} //
const getEditProduct = (req, res, next) => {
  const isEdit = req.query.edit;
  if (!isEdit) {
    return res.redirect("/");
  }
  const ID = req.params.productID; // // Lấy route động :productID bên routes (URL) - VD: http://localhost:3000/product/0.7834371053383911 => ID = 0.7834371053383911
  Product.findById(ID)
    .then((product) => {
      // {AUTHORIZATION} //
      if (product.userId.toString() !== req.user._id.toString()) {
        // Kiểm tra xem user hiện tại có phải là người tạo ra product này hay không
        return res.redirect("/admin/product"); // Nếu không phải thì redirect về trang chủ
      }
      res.render("./admin/editProduct", {
        title: "Edit Product",
        path: "/admin/add-product",
        hasFooter: false,
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
    })
    .catch((err) => {
      // {ERROR MIDDLEWARE} //
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

// {UPDATE PRODUCT BY MONGOOSE} //
const postEditProduct = (req, res, next) => {
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
  Product.findById(ID)
    .then((product) => {
      // {AUTHORIZATION} //
      if (product.userId.toString() !== req.user._id.toString()) {
        // Kiểm tra xem user hiện tại có phải là người tạo ra product này hay không
        return res.redirect("/"); // Nếu không phải thì redirect về trang chủ
      }
      // VALIDATION INPUT
      if (!errorValidation.isEmpty()) {
        console.log(errorValidation.array());
        const [error] = errorValidation.array();
        return res.status(422).render("./admin/editProduct", {
          title: "Edit Product",
          path: "/admin/add-product",
          hasFooter: false,
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
      return product
        .save()
        .then(() => {
          res.redirect("/admin/product");
          console.log("Updated!");
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/500-maintenance");
        });
    })
    .catch((err) => {
      // {ERROR MIDDLEWARE} //
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
  // Muốn nhanh hơn thì dùng method findByIdAndUpdate, ruy nhiên dùng save() có thể dùng được với middleware
};

// {DELETE PRODUCT BY MONGOOSE} //
const deleteProduct = (req, res, next) => {
  const ID = req.params.productID; // // Lấy route động :productID bên routes (URL) - VD: http://localhost:3000/product/0.7834371053383911 => ID = 0.7834371053383911
  // Vì không phải load lại trang nên không dùng method POST của form => không thể dùng req.body
  // Xoá sản phẩm trong database thì phải xoá file ảnh trong folder images (tiết kiệm ổ cứng)
  let urlDelete; // Khai báo biến url để lưu đường dẫn của file
  Product.findById(ID)
    .then((product) => {
      urlDelete = product.url; // Lưu đường dẫn của file vào biến urlDelete
      // {AUTHORIZATION} //
      Product.deleteOne({ _id: ID, userId: req.user._id }) // Kiểm tra xem user hiện tại có phải là người tạo ra product này hay không (userId: req.user._id)
        .then(() => {
          fs.unlink(urlDelete, (err) => {
            // Xóa file cũ
            if (err) {
              // Nếu có lỗi thì in ra lỗi
              console.log(err);
              next(new Error(err));
            }
          });
          // Xoá cả sản phẩm nếu có trong giỏ hàng
          req.user.cart.items = req.user.cart.items.filter((item) => {
            return item.productId.toString() !== ID.toString();
          });
          return req.user.save().then(() => {
            console.log("Deleted!");
            res.status(200).json({ message: "Delete successfull" }); // Trả về kết quả là json với message là Delete successfull
          });
        })
        .catch((err) => {
          res.status(500).json({ message: "Delete failed" }); // Trả về kết quả là json với message là Delete failed
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};
module.exports = {
  addProduct,
  postProduct,
  getProduct,
  getEditProduct,
  postEditProduct,
  deleteProduct,
};
