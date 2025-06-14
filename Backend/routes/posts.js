// post.js
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const getPostModel = require('../models/Post');
const Post = getPostModel(mongoose);
module.exports = router;
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
// 참가 신청 기능
router.post('/apply', async (req, res) => {
  const { postId, username,accepted} = req.body;

  if (!postId || !username) {
    return res.status(400).json({ error: 'postId나 username이 없습니다' });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: '해당 모집글이 없습니다' });

    if (!post.applicants) post.applicants = [];

    const alreadyApplied = post.applicants.some(app => app.username === username);
    if (alreadyApplied) {
      return res.status(400).json({ error: '이미 신청했습니다' });
    }

    post.applicants.push({ username, accepted: false }); // 기본은 미수락
    await post.save();

    res.json({ message: '✅ 참가 신청 완료!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

router.post('/apply/respond', async (req, res) => {
  const { postId, username, accepted } = req.body;

  if (!postId || !username || typeof accepted !== 'boolean') {
    return res.status(400).json({ error: '필수 정보 누락' });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: '모집글 없음' });

    const applicant = post.applicants.find(a => a.username === username);
    if (!applicant) return res.status(404).json({ error: '신청자 없음' });

    applicant.accepted = accepted;
    await post.save();

    res.json({ message: `✅ ${accepted ? '수락' : '거절'} 처리 완료` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});