const mongoose = require('mongoose');
const { Schema } = mongoose;

const ApplicationSchema = new Schema(
  {
    applicant: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      nickname: { type: String }, // 스냅샷 용(신청 당시 닉네임)
    },

    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true, // 어떤 모집글에 대한 신청인지
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },

    chatRoomId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatRoom', // 수락된 경우 채팅방 연결
      index: true,
    },

    // 수락/거절 시각을 기록해두면 디버깅/통계/자동정리 시 편함
    acceptedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },

    // 모임 종료 후 평가 여부 (필요 시 누가 평가했는지 별도 컬렉션에 저장)
    evaluated: { type: Boolean, default: false },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 관리
    versionKey: false,
  }
);

// 🔒 같은 게시글에 같은 유저가 중복 신청 못 하게(대기/수락 상태만)
//  - 거절 후 재신청 허용하려면 partialFilterExpression 사용
ApplicationSchema.index(
  { post: 1, 'applicant.userId': 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'accepted'] } } }
);

// 조회 패턴 최적화
ApplicationSchema.index({ post: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Application', ApplicationSchema);
