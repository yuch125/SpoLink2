module.exports = (mongoose) => {
  if (mongoose.models.Post) {
    return mongoose.model('Post');
  }

  const postSchema = new mongoose.Schema(
    {
      category: String,
      content: String,
      time: String,
      location: String,
      detail: String,

      // 🔄 리팩토링된 작성자 필드
      writer: {
        userId: { type: String, required: true },     // 실제 아이디
        nickname: { type: String, required: true },   // 화면용 닉네임
      },

      // 🔄 리팩토링된 신청자 배열
      applicants: [
        {
          userId: { type: String, required: true },
          accepted: { type: Boolean, default: false },
        },
      ],

      maxParticipants: {
        type: Number,
        default: 12,
      },

      expiresAt: Date,
    },
    {
      timestamps: true,
      collection: 'posts',
    }
  );

  return mongoose.model('Post', postSchema);
};
