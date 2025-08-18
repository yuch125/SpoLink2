const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  readBy: [{ type: String }], // ← ObjectId 아니고 String
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
