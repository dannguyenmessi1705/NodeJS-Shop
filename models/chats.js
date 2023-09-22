const mongoose = require("mongoose");
const SchemaTypes = mongoose.SchemaTypes;
const Schema = mongoose.Schema;
const Chat = new Schema(
  {
    message: {
      type: SchemaTypes.String,
      required: true,
    },
    url: {
      type: SchemaTypes.String,
      required: false,
    },
    sender: {
      type: SchemaTypes.ObjectId,
      ref: "users",
    },
    receiver: {
      type: SchemaTypes.ObjectId,
      ref: "users",
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("chats", Chat);
