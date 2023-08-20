const Order = require("../models/orders");
const Product = require("../models/products");
// {GET ALL PRODUCTS BY MONGOOSE} //
const getIndex = (req, res, next) => {
  const [successLogin] = req.flash("successLogin"); // Lấy giá trị Flash có tên là "successLogin"
  Product.find()
    .then((products) => {
      res.render("./user/index", {
        title: "Home",
        items: products,
        path: "/",
        successLogin: successLogin, // Truyền giá trị Flash vào biến successLogin để hiển thị thông báo
      });
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
  Product.find()
    .then((products) => {
      res.render("./user/productList", {
        title: "Product",
        items: products,
        path: "/product",
      });
    })
    .catch((err) => {
      // {ERROR MIDDLEWARE} //
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

// {GET PRODUCT DETAIL BY MONGOOSE} //
const getDetail = (req, res, next) => {
  const ID = req.params.productID; // Lấy route động :productID bên routes (URL) - VD: http://localhost:3000/product/0.7834371053383911 => ID = 0.7834371053383911
  Product.findById(ID)
    .then((product) => {
      res.render("./user/productDetail", {
        title: "Product Detail",
        path: "/product",
        item: product,
      });
    })
    .catch((err) => {
      // {ERROR MIDDLEWARE} //
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

// {POST CART USER BY MONGOOSE} //
const postCart = (req, res, next) => {
  const ID = req.body.id; // ".id" vì id được đặt trong thuộc tính name của thẻ input đã được hidden
  Product.findById(ID) // Tìm product có _id = ID
    .then((product) => {
      req.user
        .postCartByUser(product) // Thêm product vào cart User
        .then(() => {
          return res.redirect("/cart");
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
};

// {GET CART USER BY MONGOOSE} //
const getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId") // Lấy tất cả dữ liệu user, populate để lấy thêm dữ liệu từ collection products vào thuộc tính productId của cart
    .then((user) => {
      let products = [...user.cart.items]; // Sau khi lấy được dữ liệu từ collection products qua populate, copy lại vào biến products
      return products; // Trả về kết quả
    })
    .then((products) => {
      // products = [{productId: {}, quantity, _id} ,{}]
      let totalPrice = products.reduce((sum, product, index) => {
        // Tính tổng tiền của tất cả product trong cart
        return +product.productId.price * product.quantity + sum;
      }, 0); // Tính tổng tiền của tất cả product trong cart
      return res.render("./user/cart", {
        title: "Cart",
        path: "/cart",
        items: products,
        totalPrice: totalPrice,
      }); // Render ra dữ liệu, đồng thời trả về các giá trị động cho file cart.ejs
    })
    .catch((err) => {
      // {ERROR MIDDLEWARE} //
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

// {DELETE CART USER BY MONGOOSE} //
const deleteCart = (req, res, next) => {
  const ID = req.body.id; // ".id" vì id được đặt trong thuộc tính name của thẻ input đã được hidden
  Product.findById(ID) // Tìm product có _id = ID
    .then((product) => {
      req.user
        .deleteCartByUser(product) // Xoá product trong cart User
        .then((result) => {
          return res.redirect("/cart");
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
};

// {POST ORDER BY USER IN MONGOOSE}
const postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId") // Lấy tất cả dữ liệu user, populate để lấy thêm dữ liệu từ collection products vào thuộc tính productId của cart
    .then((user) => {
      const products = [...user.cart.items]; // Sau khi lấy được dữ liệu từ collection products qua populate, copy lại vào biến products
      return products;
    })
    .then((products) => {
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
      });
      return order.save(); // Lưu order vào database
    })
    .then(() => {
      return req.user.clearCart(); // Xoá cart của user
    })
    .then(() => res.redirect("/order"))
    .catch((err) => {
      // {ERROR MIDDLEWARE} //
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

// {GET ORDER BY USER IN MONGOOSE} //
const getOrder = (req, res, next) => {
  Order.find({ "user.userId": req.user._id }) // Tìm kiếm order có userId = userId của user hiện tại
    .then((orders) => {
      // orders = [{ {products: {}, quantity}, user{}}, {}]
      res.render("./user/order", {
        title: "Order",
        path: "/order",
        orders: orders,
      });
    })
    .catch((err) => {
      // {ERROR MIDDLEWARE} //
      const error = new Error(err);
      error.httpStatusCode = 500;
      next(error);
    });
};

module.exports = {
  getIndex,
  getProduct,
  getDetail,
  postCart,
  getCart,
  deleteCart,
  postOrder,
  getOrder,
};
