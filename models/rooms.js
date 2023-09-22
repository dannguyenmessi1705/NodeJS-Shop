const mongoose = require("mongoose");
const SchemaTypes = mongoose.SchemaTypes;
const Schema = mongoose.Schema;
const Room = new Schema({
  participants: [
    {
      type: SchemaTypes.ObjectId,
      ref: "users",
    },
  ],
  messages: [
    {
      type: SchemaTypes.ObjectId,
      ref: "chats",
    },
  ],
  countUnRead: {
    type: SchemaTypes.Number,
    default: 0,
  },
});
module.exports = mongoose.model("rooms", Room);