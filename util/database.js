const URLMongo = process.env.URL_MONGO // URL của database
const dbname = "shop"; // Đặt tên cho database
const URL = URLMongo.replace(/\?retryWrites=true/i, dbname+"?retryWrites=true"); // đổi tên cho database
module.exports = URL;

