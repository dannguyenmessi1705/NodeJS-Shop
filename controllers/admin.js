const products = require("../models/products");
const Product = require("../models/products");

// {VALIDATION INPUT} //
const { validationResult } = require("express-validator");

// {ADD PRODUCT PAGE} //
const addProduct = (req, res) => {
  res.render("./admin/editProduct", {
    title: "Add Product",
    path: "/admin/add-product",
    editing: false, // Phân biệt với trạng thái Edit vs Add Product
    error: undefined,
    errorType: undefined, //  ban đầu chưa có giá trị nào lỗi
    oldInput: {
      name: "",
      price: "",
      url: "",
      description: ""
    }, // Lưu lại các giá trị vừa nhập (vì ban đầu không có giá trị nào trong trường cả)
  });
};

// {CREAT PRODUCT BY MONGOOSE} //
const postProduct = (req, res) => {
  const data = JSON.parse(JSON.stringify(req.body));
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
        name: data.name,
        price: data.price,
        url: data.url,
        description: data.description
      }, // Lưu lại các giá trị vừa nhập 
    });
  }
  const product = new Product({
    name: data.name,
    price: data.price,
    url: data.url,
    description: data.description,
    userId: req.user._id,
  });
  return product
    .save()
    .then((result) => {
      console.log("Created Product");
      res.redirect("/admin/product");
    })
    .catch((err) => console.log(err));
};

// {GET ALL PRODUCTS BY MONGOOSE} //
const getProduct = (req, res) => {
  // {AUTHORIZATION} //
  Product.find({ userId: req.user._id }) // Chỉ lấy các product có userId trùng với id của user hiện tại, nếu không có thì không cho hiển thị
    .select("name price url description _id")
    .exec() // Chỉ lấy các thuộc tính name, price, url, description, bỏ thuộc tính _id
    .then((products) => {
      res.render("./admin/products", {
        title: "Admin Product",
        items: products,
        path: "/admin/product",
      });
    })
    .catch((err) => console.log(err));
};

// {GET EDIT PRODUCT BY MONGOOSE} //
const getEditProduct = (req, res) => {
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
        editing: isEdit, // truyền giá trị của query 'edit' vào biến editing để kiểm tra xem có phải đang ở trạng thái edit hay không
        item: product, // gán product vừa tìm được vào biến item để đưa vào file ejs
        error: undefined,
        errorType: undefined, //  ban đầu chưa có giá trị nào lỗi
        oldInput: {
          name: "",
          price: "",
          url: "",
          description: ""
        }, // Lưu lại các giá trị vừa nhập (vì ban đầu không có giá trị nào trong trường cả)
      });
    })
    .catch((err) => console.log(err));
};

// {UPDATE PRODUCT BY MONGOOSE} //
const postEditProduct = (req, res) => {
  const data = req.body;
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
          editing: true, // truyền giá trị của query 'edit' vào biến editing để kiểm tra xem có phải đang ở trạng thái edit hay không
          item: product,
          error: error.msg,
          errorType: error.path, //  Xác định trường nào chứa giá trị lỗi
          oldInput: {
            name: data.name,
            price: data.price,
            url: data.url,
            description: data.description
          }, // Lưu lại các giá trị vừa nhập 
        });
      }
      // Cập nhật lại các giá trị của product theo req.body
      product.name = data.name;
      product.price = data.price;
      product.url = data.url;
      product.description = data.description;
      // Lưu lại vào database
      return product
        .save()
        .then(() => {
          res.redirect("/admin/product");
          console.log("Updated!");
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
  // Muốn nhanh hơn thì dùng method findByIdAndUpdate, ruy nhiên dùng save() có thể dùng được với middleware
};

// {DELETE PRODUCT BY MONGOOSE} //
const deleteProduct = (req, res) => {
  const ID = req.body.id;
  // {AUTHORIZATION} //
  Product.deleteOne({ _id: ID, userId: req.user._id }) // Kiểm tra xem user hiện tại có phải là người tạo ra product này hay không (userId: req.user._id)
    .then(() => {
      res.redirect("/admin/product");
    })
    .catch((err) => console.log(err));
};
module.exports = {
  addProduct,
  postProduct,
  getProduct,
  getEditProduct,
  postEditProduct,
  deleteProduct,
};
