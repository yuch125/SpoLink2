const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
  },
  sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
  },
  content: String,
}, {
  timestamps: true,
});

// 반드시 이렇게 모듈 전체를 export 해야 합니다:
module.exports = mongoose.model('Message', messageSchema);