const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  username: { type: String, required: true },  // 신청자 닉네임
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
});

module.exports = mongoose.model('application', applicationSchema);
