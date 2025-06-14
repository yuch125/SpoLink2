// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');  // Mongoose User 모델

// 1) 사용자 정보 조회
// GET /users/:username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // 클라이언트가 { nickname, bio } 형태로 받도록 반환
    return res.json({
      nickname: user.nickname,
      bio: user.bio,
    });
  } catch (err) {
    console.error('GET /users/:username error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// 2) 기존 PATCH 라우터 (이미 구현되어 있겠지만, 예시 차원에서)
router.patch('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { newNickname, intro } = req.body;
    const user = await User.findOneAndUpdate(
      { username },
      { nickname: newNickname, bio: intro },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      nickname: user.nickname,
      bio: user.bio,
    });
  } catch (err) {
    console.error('PATCH /users/:username error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

