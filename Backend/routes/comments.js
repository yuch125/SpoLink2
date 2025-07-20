const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

// [GET] 댓글 불러오기
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: -1 });
    res.json({ success: true, comments });
  } catch (err) {
    console.error('❌ 댓글 조회 실패:', err);
    res.status(500).json({ success: false, message: '서버 에러' });
  }
});

// [POST] 댓글 작성
router.post('/', async (req, res) => {
  const { postId, userId, nickname, content } = req.body;
  console.log('💬 댓글 요청 데이터:', { postId, userId, nickname, content });
  if (!postId || !userId || !nickname || !content) {
    return res.status(400).json({ success: false, message: '필수 항목 누락' });
  }

  try {
    const newComment = await Comment.create({
      postId,
      userId,
      nickname,
      content,
    });
    res.status(201).json({ success: true, comment: newComment });
  } catch (err) {
    console.error('❌ 댓글 작성 실패:', err);
    res.status(500).json({ success: false, message: '서버 에러' });
  }
});

module.exports = router;