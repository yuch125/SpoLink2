const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // 로그인 ID
    username: { type: String, required: true, unique: true },
    // 비밀번호
    password: { type: String, required: true },
    // 사용자 표시 이름
    nickname: { type: String },
    // 프로필 이미지 URL
    profileImage: { type: String },
    // 한 줄 소개
    bio: { type: String },
  },
  {
    timestamps: true,
    collection: 'users',
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_, ret) => {
        ret.userId = ret._id;
        delete ret._id;
        delete ret.password; // 보안상 password는 응답에서 제거
        return ret;
      },
    },
  }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
