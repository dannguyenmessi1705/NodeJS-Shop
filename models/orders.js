const mongoose = require("mongoose");
const SchemaTypes = mongoose.SchemaTypes;
const Schema = mongoose.Schema;

const Order = new Schema({
  products: {
    type: SchemaTypes.Object,
  },
  user: {
    username: {
      type: SchemaTypes.String,
      required: true,
    },
    email: {
      type: SchemaTypes.String,
      required: true,
    },
    userId: {
      type: SchemaTypes.ObjectId,
      required: true,
    },
  },
  date: SchemaTypes.String,
});

module.exports = mongoose.model("orders", Order);
