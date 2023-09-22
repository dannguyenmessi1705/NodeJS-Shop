const Order = require("../models/orders");
const Product = require("../models/products");

// {PDFKIT FOR CREATE PDF TO PRINT, DOWNLOAD THE INCVOICE} //
const pdfkit = require("pdfkit");
const fs = require("fs");
const path = require("path");
const rootDir = require("../util/path");
const products = require("../models/products");

// {DEFINE THE NUMBER OF PER PAGE} //
const productOfPage = 6;
const itemOfOrder = 10;

// {GET ALL PRODUCTS BY MONGOOSE} //
const getIndex = (req, res, next) => {
  const [successLogin] = req.flash("successLogin"); // Lấy giá trị Flash có tên là "successLogin"
  res.header("Cache-Control", "no-cache"); // Không lưu cache
  res.render("./user/index", {
    // Render ra dữ liệu, đồng thời trả về các giá trị động cho file index.ejs
    title: "Home",
    path: "/",
    successLogin: successLogin, // Truyền giá trị Flash vào biến successLogin để hiển thị thông báo
  });
};

// {GET ALL PRODUCTS BY MONGOOSE} //
const getProduct = (req, res, next) => {
  const curPage = +req.query.page || 1; // Lấy giá trị page từ URL, nếu không có thì mặc định là 1
  let numProducts; // Tạo biến để lưu số lượng sản phẩm
  Product.countDocuments() // Đếm số có trong collection products
    .then((numOfProducts) => {
      numProducts = numOfProducts; // Lưu số lượng sản phẩm vào biến numProducts
      Product.find() // Tìm tất cả các sản phẩm
        .skip((curPage - 1) * productOfPage) // Bỏ qua các sản phẩm trước sản phẩm đầu tiên của trang hiện tại
        .limit(productOfPage) // Giới hạn số lượng sản phẩm trên 1 trang
        .then((products) => {
          res.render("./user/productList", {
            title: "Product",
            items: products,
            path: "/product",
            lastPage: Math.ceil(numProducts / productOfPage), // Tính số lượng trang
            curPage: curPage, // Trang hiện tại
            nextPage: curPage + 1, // Trang tiếp theo
            prevPage: curPage - 1, // Trang trước đó
            hasPrevPage: curPage > 1, // Kiểm tra xem có trang trước đó hay không
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

// {GET PRODUCT DETAIL BY MONGOOSE} //
const getDetail = (req, res, next) => {
  const ID = req.params.productID; // Lấy route động :productID bên routes (URL) - VD: http://localhost:3000/product/0.7834371053383911 => ID = 0.7834371053383911
  Product.findById(ID)
    .then((product) => {
      res.render("./user/productDetail", {
        title: "Product Detail",
        path: "/product",
        item: product,
        userId: req.user._id,
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
        totalPrice: totalPrice.toFixed(2),
        userId: req.user._id,
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
  const currentDate = new Date();
  const options = { timeZone: "Etc/GMT+7" };
  const localDate = currentDate.toLocaleString("en-US", options);
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
      productArray.forEach(async (item) => {
        // Lặp qua tất cả các sản phẩm trong cart
        try {
          const product = await Product.findById(item.product._id); // Tìm product có _id = _id của sản phẩm trong cart
          product.soldQuantity += item.quantity; // Tăng số lượng sản phẩm đã bán
          await product.save(); // Lưu lại
        } catch (error) {
          res.status(500).json({ message: "Server error" });
        }
      }); // Cập nhật số lượng sản phẩm đã bán
      const order = new Order({
        // Tạo order mới
        products: productArray,
        user: {
          username: req.user.username,
          email: req.user.email,
          userId: req.user._id,
        },
        date: localDate,
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
  const curPage = req.query.page || 1; // Lấy giá trị page từ URL, nếu không có thì mặc định là 1
  let numProducts; // Tạo biến để lưu số lượng sản phẩm
  Order.countDocuments({ "user.userId": req.user._id }) // Đếm số lượng order có userId = userId của user hiện tại
    .then((numOfProducts) => {
      numProducts = numOfProducts; // Lưu số lượng sản phẩm vào biến numProducts
      Order.find({ "user.userId": req.user._id }) // Tìm kiếm order có userId = userId của user hiện tại
        .skip((curPage - 1) * itemOfOrder) // Bỏ qua các order trước order đầu tiên của trang hiện tại
        .limit(itemOfOrder) // Giới hạn số lượng order trên 1 trang
        .then((orders) => {
          // orders = [{ {products: {}, quantity}, user{}}, {}]
          res.render("./user/order", {
            title: "Order",
            path: "/order",
            orders: orders,
            lastPage: Math.ceil(numProducts / itemOfOrder), // Tính số lượng trang
            curPage: curPage, // Trang hiện tại
            nextPage: curPage + 1, // Trang tiếp theo
            prevPage: curPage - 1, // Trang trước đó
            hasPrevPage: curPage > 1, // Kiểm tra xem có trang trước đó hay không
            hasNextPage: curPage < Math.ceil(numProducts / itemOfOrder), // Kiểm tra xem có trang tiếp theo hay không
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

// {DOWNLOAD THE INVOICE} //
// {GET INVOICE} // http:.../order/orderID
const getInvoice = (req, res, next) => {
  const orderId = req.params.orderId; // Lấy route động :orderId bên routes (URL) - VD: http://localhost:3000/order/5f9b7b3b3b3b3b3b3b3b3b3b => orderId = 5f9b7b3b3b3b3b3b3b3b3b3b
  Order.findById(orderId) // Tìm order có _id = orderId
    .then((order) => {
      // order = {products: [{product: {}, quantity}], user: {}}
      if (order.user.userId.toString() !== req.user._id.toString()) {
        // Kiểm tra xem user hiện tại có phải là người đặt hàng hay không
        return next(new Error("Not Authorized")); // Nếu không phải thì trả về lỗi
      }
      const fontPath = path.join(rootDir, "public", "font", "fontvn.ttf"); // Thêm font utf-8 unicode vào để hiển thị dấu
      const nameInvoice = "Invoice-" + orderId + ".pdf"; // Tạo tên file invoice
      const dateOrder = order.date; // Thêm ngày order hàng
      res.setHeader("Content-Type", "application/pdf"); // Set header cho file pdf là application/pdf để trình duyệt hiểu đây là file pdf
      res.setHeader(
        // Set header cho file pdf
        "Content-Disposition", // Content-Disposition là thuộc tính của header, nó cho phép chúng ta đặt tên cho file pdf khi download về máy
        "inline; filename='" + nameInvoice + "'" // inline: hiển thị file pdf trên trình duyệt, filename: đặt tên cho file pdf
      );
      const pdfDoc = new pdfkit(); // Tạo file pdf mới bằng pdfkit
      pdfDoc.pipe(
        // Pipe file pdf mới vào res để trình duyệt hiểu đây là file pdf
        fs.createWriteStream(path.join(rootDir, "data", "invoice", nameInvoice)) // Tạo file pdf mới trong thư mục data
      );
      pdfDoc.pipe(res); // Pipe file pdf mới vào res để trình duyệt hiểu đây là file pdf
      pdfDoc.font(fontPath);
      pdfDoc.fontSize(36).text("SHOP DIDAN", {
        // Tạo tiêu đề cho file pdf
        align: "center", // Căn giữa
        underline: "true", // Gạch chân
      });
      pdfDoc.fontSize(22).text("Invoice " + dateOrder, {
        // Tạo tiêu đề cho file pdf
        align: "center", // Căn giữa
        lineGap: 16, // Khoảng cách giữa các dòng
      });
      pdfDoc.fontSize(16).text(`Customer's Name: ${order.user.username}`); // Tạo tên khách hàng
      pdfDoc.fontSize(16).text(`Invoice ID: ${order._id}`, {
        // Tạo ID cho file pdf
        lineGap: 16, // Khoảng cách giữa các dòng
      });
      let data = [["ID", "NAME", "QUANTITY", "PRICE"]]; // Tạo mảng chứa các dữ liệu của sản phẩm
      let numth = 0; // Biến đếm số thứ tự
      let totalPrice = 0; // Biến tính tổng tiền
      order.products.forEach((prod) => {
        // Lặp qua tất cả các sản phẩm trong order
        numth++; // Tăng biến đếm số thứ tự
        let priceItem = prod.product.price * prod.quantity;
        totalPrice += priceItem; // Tính tổng tiền
        data = data.concat([
          [numth, prod.product.name, prod.quantity, "$" + priceItem, ,],
        ]); // Thêm dữ liệu của sản phẩm vào mảng data
      });
      data.push(["", "", "Total Price", "$" + totalPrice.toFixed(2)]); // Thêm hàng tính tổng tiền
      const startX = -40; // Tọa độ x trong file pdf
      const startY = 210; // Tọa độ y trong file pdf
      const rowHeight = 30; // Chiều cao của mỗi dòng
      const colWidth = 170; // Chiều rộng của mỗi cột
      pdfDoc.font(fontPath); // Set font cho file pdf
      pdfDoc.fontSize(16); // Set font size cho file pdf
      data.forEach((row, rowIndex) => {
        // Lặp qua tất cả các mảng(hàng) trong mảng data
        row.forEach((cell, colIndex) => {
          // Lặp qua tất cả các cột(phần tử) trong mảng row
          const x = startX + colWidth * colIndex; // Tọa độ x của mỗi cột
          const y = startY + rowHeight * rowIndex; // Tọa độ y của mỗi hàng
          pdfDoc.rect(x, y - 10, colWidth, rowHeight).stroke(); // Tạo khung cho mỗi cột
          pdfDoc.text(cell, x, y, {
            // Tạo dữ liệu cho mỗi cột
            width: colWidth, // Chiều rộng của mỗi cột
            height: rowHeight, // Chiều cao của mỗi cột
            align: "center", // Căn giữa
            lineGap: 5, // Khoảng cách giữa các dòng
          });
        });
      });
      pdfDoc.end(); // Kết thúc file pdf
    })
    .catch((err) => {
      const error = new Error(err); // Nếu có lỗi thì trả về lỗi
      error.httpStatusCode = 422; // 422 là lỗi do người dùng nhập sai dữ liệu
      next(error); // Trả về lỗi
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
  getInvoice,
};
