// Backend/routes/evaluations.js
const express = require('express');
const router = express.Router();
const Evaluation = require('../models/Evaluation');
const Post = require('../models/Post');
const User = require('../models/User')

// POST /evaluations  { postId, raterId, targetUserId, value: 1|-1 }
router.post('/', async (req, res) => {
  try {
    const { postId, raterId, targetUserId, value } = req.body;
    if (!postId || !raterId || !targetUserId || ![1, -1].includes(value)) {
      return res.status(400).json({ error: 'postId, raterId, targetUserId, value 필요' });
    }

    const post = await Post.findById(postId).select('_id');
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // 🔒 같은 모임 중복 평가 방지
    const exists = await Evaluation.findOne({ postId, raterId, targetUserId });
    if (exists) return res.status(409).json({ error: 'already_evaluated' });

    // 평가 저장
    const doc = await Evaluation.create({ postId, raterId, targetUserId, value });

    // 🔥 User에 반영
    if (value === 1) {
      await User.findByIdAndUpdate(targetUserId, { $inc: { likesCount: 1 } });
    } else {
      await User.findByIdAndUpdate(targetUserId, { $inc: { dislikesCount: 1 } });
    }

    return res.json({ ok: true, evaluation: doc });
  } catch (err) {
    console.error('POST /evaluations error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});


// GET /evaluations/status?postId=&raterId=&targetUserId=
router.get('/status', async (req, res) => {
  const { postId, raterId, targetUserId } = req.query;
  if (!postId || !raterId || !targetUserId) {
    return res.status(400).json({ error: 'params 부족' });
  }
  const exists = await Evaluation.exists({ postId, raterId, targetUserId });
  return res.json({ evaluated: !!exists });
});

module.exports = router;
