const mongoose = require('mongoose');

const ChatRoomSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  participants: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      nickname: String,
    },
  ],
}, {
  timestamps: true,
});

module.exports = mongoose.model('ChatRoom', ChatRoomSchema);