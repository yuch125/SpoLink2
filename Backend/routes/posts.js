const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const getPostModel = require('../models/Post');
const Post = getPostModel(mongoose);
// 모집 카드 생성
router.post('/', async (req, res) => {
  try {
    console.log('▶▶▶ /posts POST 진입');
    console.log('📥 받은 요청 데이터:', req.body);

    // 현재 시각 기준으로 2시간 뒤 마감 시간 설정
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2시간 뒤

    const post = new Post({
      ...req.body,
      participants: 0,
      maxParticipants: 12,
      expiresAt, // 강제로 미래 시간 설정
    });

    const saved = await post.save();
    console.log('✅ 저장된 데이터:', saved);
    res.status(201).json(saved);
  } catch (err) {
    console.error('❌ 저장 실패:', err);
    res.status(400).json({ error: err.message });
  }
});

// 모집 카드 전체 조회 (마감시간 지난 카드 제외)
router.get('/', async (req, res) => {
  const now = new Date();
  try {
    const posts = await Post.find().populate('writer', 'username nickname profileImage'); // ✅ 이 줄!
    res.json(posts);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
//삭제 기능
router.delete('/:id', async (req, res) => {
  try {
    const Post = getPostModel(mongoose);
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: '삭제 실패' });
  }
});

// 모집 카드 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Post.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Post not found' });
    res.json(updated);
  } catch (err) {
    console.error('❌ 수정 오류:', err);
    res.status(500).json({ error: '수정 실패' });
  }
});