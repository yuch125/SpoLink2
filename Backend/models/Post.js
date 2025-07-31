// models/Post.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const postSchema = new Schema({
  writer:             { type: Schema.Types.ObjectId, ref: 'User', required: true },
  writerNickname:     { type: String, required: true },
  writerProfileImage: { type: String },
  category:           { type: String, required: true },
  content:            { type: String, required: true },
  time:               String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [경도, 위도]
  },
  locationName: { type: String, required: true }, // 장소명
  detail:             String,
  applicants: [
    { userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, accepted: Boolean }
  ],
  maxParticipants:    { type: Number, default: 12 },
  expiresAt:          Date
}, {
  timestamps: true,
  collection: 'posts'
});
postSchema.index({ location: '2dsphere' });
// ← 여기를 함수가 아니라 **직접 모델**을 export
const Post = mongoose.model('Post', postSchema);
module.exports = Post;

