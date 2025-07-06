const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicant: {
    userId: { type: String, required: true },      // 로그인 ID
    nickname: { type: String, required: true },    // 사용자 표시용
  },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'pending',
  },
});

module.exports = mongoose.model('Application', applicationSchema);
