const mongoose = require('mongoose');

const trustEvaluationSchema = new mongoose.Schema({
  evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  target: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// evaluator + target 조합은 한 번만 허용
trustEvaluationSchema.index({ evaluator: 1, target: 1 }, { unique: true });

module.exports = mongoose.model('TrustEvaluation', trustEvaluationSchema);
