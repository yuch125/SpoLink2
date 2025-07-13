const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicant: {
    userId: { type: String, required: true },       // 유저 고유 ID (로그인용)
    nickname: { type: String, required: true },     // 유저 닉네임 (화면 표시용)
  },

  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,                                 // 어떤 모집글에 대한 신청인지
  },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',                             // 수락, 거절, 대기 중 상태
  },

  chatRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',                                // 수락된 경우 채팅방 연결
  },

  createdAt: {
    type: Date,
    default: Date.now,                              // 신청 시간
  },

  evaluated: {
    type: Boolean,
    default: false,                                 // 모임 종료 후 평가 여부
  }
});

module.exports = mongoose.model('Application', applicationSchema);
