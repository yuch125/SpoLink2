const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');      // ← 이 줄 추가
const Post = require('../models/Post');
const Comment = require('../models/Comment');
// 1) 사용자 정보 조회
// GET /users/:userId
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;


    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
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
    const { newNickname, bio, ageGroup, profileImage } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 닉네임 변경 제한 (최대 3회)
    if (typeof newNickname === 'string' && newNickname !== user.nickname) {
      if (user.nicknameChangeCount >= 3) {
        return res.status(400).json({ error: '닉네임은 최대 3회까지 변경 가능합니다.' });
      }
      user.nickname = newNickname;
      user.nicknameChangeCount += 1;
      
      await mongoose.model('Post').updateMany(
        { 'writer.userId': user._id.toString() },
        { $set: { 'writer.nickname': newNickname } }
      );
      await mongoose.model('Comment').updateMany(
        { userId: user._id.toString() },
        { $set: { nickname: newNickname } }
      );
    }


    // 3) 과거 게시글·댓글 동기화

    if (bio !== undefined) user.bio = bio;
    if (ageGroup !== undefined) user.ageGroup = ageGroup;
    if (profileImage !== undefined) user.profileImage = profileImage; // ✅ 추가된 부분

    await user.save();
    return res.json({ user });  // 수정 후 응답

  } catch (err) {
    console.error('PATCH /users/:userId error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;