const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // 로그인 ID
    username: { type: String, required: true, unique: true },
    // 비밀번호
    password: { type: String, required: true },
    // 사용자 표시 이름
    nickname: { type: String },
    // 한 줄 소개
    bio: { type: String },
    age : {type : Number, default: null},
    // 나이 그룹
    ageGroup: {
      type: String,
      enum: [
        '중학생',
        '고등학생',
        '대학생',
        '20대','30대','40대','50대 이상',
        '나이'
      ],
      default: '나이'
    },    

    profileImage: {
      type: String, // 업로드된 이미지의 URL
      default: '',  // 없을 경우 기본 이미지
    },
    likesCount: { type: Number, default: 0 },
 dislikesCount: { type: Number, default: 0 },

  // 닉네임 변경 가능 횟수 관리
  nicknameChangeCount: { type: Number, default: 0 },
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
          delete ret.password;
          ret.bio = ret.bio;
          ret.ageGroup = ret.ageGroup;
          ret.trustScore = ret.trustScore;
          ret.remainingNicknameChanges = 3 - (ret.nicknameChangeCount || 0);// 보안상 password는 응답에서 제거
          return ret;
        },
    },
}
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);