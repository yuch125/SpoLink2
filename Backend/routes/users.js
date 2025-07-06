const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 1) 사용자 정보 조회
// GET /users/:userId
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      userId: user._id,
      username: user.username,
      nickname: user.nickname,
      bio: user.bio,
    });
  } catch (err) {
    console.error('GET /users/:userId error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// 2) 사용자 정보 수정
// PATCH /users/:userId
router.patch('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { newNickname, intro } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { nickname: newNickname, bio: intro },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      userId: user._id,
      username: user.username,
      nickname: user.nickname,
      bio: user.bio,
    });
  } catch (err) {
    console.error('PATCH /users/:userId error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
