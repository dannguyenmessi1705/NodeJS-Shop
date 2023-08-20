const URLMongo =
  "mongodb+srv://nodejsshop:12345@shop.zjodmkn.mongodb.net/?retryWrites=true&w=majority"; // URL của database
const dbname = "shop"; // Đặt tên cho database
const URL = URLMongo.replace(/\?retryWrites=true/i, dbname+"?retryWrites=true"); // đổi tên cho database
module.exports = URL;

