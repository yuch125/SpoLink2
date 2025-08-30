const mongoose = require('mongoose');
const { Schema } = mongoose;

const postSchema = new Schema({
  chatMemberCount: { type: Number, default: 1, min: 0 }, // 채팅방 현재 인원(주최자 포함)
  writer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  writerNickname: { type: String, required: true },
  writerProfileImage: { type: String },
  category: { type: String, required: true },
  content: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [경도, 위도]
  },
  locationName: { type: String, required: true },
  detail: String,
  applicants: [
    { userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, accepted: Boolean }
  ],
  maxParticipants: { type: Number, required: true },
  // ✅ 선호 연령대: 최대 2개, 배열로 저장
  preferredAgeGroups: {
    type: [String],
    enum: [
      '중학생',
      '고등학생',
      '20대',
      '30대',
      '40대',
      '50대',
      '상관없음'
    ],
    default: ['상관없음'],
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length <= 2,
      message: '선호 연령대는 최대 2개까지 선택 가능합니다.',
    },
  },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  isFull: { type: Boolean, default: false },       // ✅ Real field로 유지
  expiresAt: Date
}, {
  timestamps: true,
  collection: 'posts',
  toJSON: { virtuals: true },  // 유지해도 상관없음
  toObject: { virtuals: true }
});

postSchema.index({ location: '2dsphere' });

postSchema.virtual('participantCount').get(function () {
  const acceptedCount = (this.applicants || []).filter(a => a.accepted === true).length;
  return 1 + acceptedCount;
});

// ✅ (선택) 저장 시 chatMemberCount 동기화
postSchema.pre('save', function (next) {
  const acceptedCount = (this.applicants || []).filter(a => a.accepted === true).length;
  this.chatMemberCount = 1 + acceptedCount; // 주최자 포함
  next();
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
