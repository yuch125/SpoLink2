// Backend/models/Evaluation.js
const { Schema, model, Types } = require('mongoose');

const EvaluationSchema = new Schema({
  postId:       { type: Types.ObjectId, ref: 'Post', required: true, index: true },
  raterId:      { type: Types.ObjectId, ref: 'User', required: true, index: true },
  targetUserId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  // 좋아요/싫어요
  value:        { type: Number, enum: [1, -1], required: true },
  createdAt:    { type: Date, default: Date.now },
});

// 🔒 모임(post)당 rater→target 1회만 허용(핵심)
EvaluationSchema.index({ postId: 1, raterId: 1, targetUserId: 1 }, { unique: true });

module.exports = model('Evaluation', EvaluationSchema);
