// models/Post.js

module.exports = (mongoose) => {
  if (mongoose.models.Post) {
    return mongoose.model('Post');
  }

  const postSchema = new mongoose.Schema({
    category: String,
    content: String,
    time: String,
    location: String,
    detail: String,
    writer: String,
    // ✅ 여러 명의 참가자 저장
    applicants: [
      {
        username: String,
        accepted: { type: Boolean, default: false },
      },
    ],
    maxParticipants: {
      type: Number,
      default: 12,
    },
    expiresAt: Date,
  }, {
    timestamps: true,
    collection: 'posts'
  });

  return mongoose.model('Post', postSchema);
};
