const express = require('express');
const router = express.Router();
const User = require('../models/User');

function calcTrust(up = 0, down = 0) {
  const total = up + down;
  const score = Math.round(((up + 1) / (total + 2)) * 100);
  if (total >= 3) {
    if (score >= 80) grade = '매우높음';
    else if (score >= 60) grade = '높음';
    else if (score >= 40) grade = '보통';
    else if (score >= 20) grade = '낮음';
    else grade = '매우낮음';
  }
  return { score, grade, total };
}

router.get('/summary/:userId', async (req, res) => {
  const user = await User.findById(req.params.userId)
    .select('likesCount dislikesCount trustScore trustScoreCount')
    .lean();
  if (!user) return res.status(404).json({ error: 'user_not_found' });

  const up = user.likesCount ?? 0;
  const down = user.dislikesCount ?? 0;
  const { score, grade, total } = calcTrust(up, down);

  return res.json({
    score, grade, total, likes: up, dislikes: down
  });
});

module.exports = router;
