const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Application = require('../models/Application')
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
      nickname: user.nickname,
      bio: user.bio,
      profileImage: user.profileImage,
      trustScore: user.trustScore ?? 0,

    });
  } catch (err) {
    console.error('GET /users/:userId error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /users/:userId/applications
router.get('/:userId/applications', async (req, res) => {
  try {
    const { userId } = req.params;
    const apps = await Application
      .find({ 'applicant.userId': userId, status: 'accepted' })
      .populate({
        path: 'post',
        populate: { path: 'writer', select: 'userId nickname profileImage' }
      });
    // null인 post를 제거
    const posts = apps
      .map(a => a.post)
      .filter(p => p != null);
    return res.json(posts);
  } catch (err) {
    console.error('참가 모임 조회 오류', err);
    return res.status(500).json({ error: '참가 모임을 불러올 수 없습니다.' });
  }
});


// 2) 사용자 정보 수정
// PATCH /users/:userId
// routes/users.js 에서 PATCH 핸들러 바로 위
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

      await Post.updateMany(
        { writer: user._id },
        { $set: { writerNickname: newNickname, writerProfileImage: profileImage } }
      );
      await Comment.updateMany(
        { author: user._id },                                // ← ObjectId 참조 필드로 필터
        {
          $set: {
            nickname: newNickname,                           // ← 새로 추가한 nickname
            profileImage: profileImage                       // ← 새로 추가한 profileImage
          }
        }
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