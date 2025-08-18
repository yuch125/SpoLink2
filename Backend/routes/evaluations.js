// Backend/routes/evaluations.js
const express = require('express');
const router = express.Router();
const Evaluation = require('../models/Evaluation');
const Post = require('../models/Post');

// POST /evaluations  { postId, raterId, targetUserId, value: 1|-1 }
router.post('/', async (req, res) => {
  try {
    const { postId, raterId, targetUserId, value } = req.body;
    if (!postId || !raterId || !targetUserId || ![1, -1].includes(value)) {
      return res.status(400).json({ error: 'postId, raterId, targetUserId, value(1|-1) 필요' });
    }

    const post = await Post.findById(postId).select('_id');
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const doc = await Evaluation.create({ postId, raterId, targetUserId, value });
    return res.json({ ok: true, evaluation: doc });
  } catch (err) {
    if (err?.code === 11000) { // 🔁 같은 모임에서 중복 평가 방지
      return res.status(409).json({ ok: false, error: 'already_evaluated' });
    }
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
