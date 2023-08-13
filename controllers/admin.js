const products = require("../models/products");
const Product = require("../models/products");
// {ADD PRODUCT PAGE} //
const addProduct = (req, res) => {
  res.render("./admin/editProduct", {
    title: "Add Product",
    path: "/admin/add-product",
    editing: false, // Phân biệt với trạng thái Edit vs Add Product
  });
};

// {CREAT PRODUCT BY MONGOOSE} //
const postProduct = (req, res) => {
  const data = JSON.parse(JSON.stringify(req.body));
  const product = new Product({
    name: data.name,
    price: data.price,
    url: data.url,
    description: data.description,
    userId: req.user._id,
  });
  product
    .save()
    .then((result) => {
      console.log("Created Product");
      res.redirect("/admin/product");
    })
    .catch((err) => console.log(err));
};

// {GET ALL PRODUCTS BY MONGOOSE} //
const getProduct = (req, res) => {
  Product.find()
    .select("name price url description -_id")
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
      res.render("./admin/editProduct", {
        title: "Edit Product",
        path: "/admin/add-product",
        editing: isEdit, // truyền giá trị của query 'edit' vào biến editing để kiểm tra xem có phải đang ở trạng thái edit hay không
        item: product, // gán product vừa tìm được vào biến item để đưa vào file ejs
      });
    })
    .catch((err) => console.log(err));
};

// {UPDATE PRODUCT BY MONGOOSE} //
const postEditProduct = (req, res) => {
  const data = req.body;
  const ID = req.body.id; // ".id" vì id được đặt trong thuộc tính name của thẻ input đã được hidden
  Product.findById(ID)
    .then((product) => {
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
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
  // Muốn nhanh hơn thì dùng method findByIdAndUpdate, ruy nhiên dùng save() có thể dùng được với middleware
};

// {DELETE PRODUCT BY MONGOOSE} //
const deleteProduct = (req, res) => {
  Product.findByIdAndRemove(ID)
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
