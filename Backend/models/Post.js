// models/Post.js

module.exports = (mongoose) => {
  // 이미 등록된 모델이 있다면 그걸 반환 (에러 방지)
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
    participants: {
      type: Number,
      default: 0,
    },
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
