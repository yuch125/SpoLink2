const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const User = require('../models/User'); // ⬅️ 사용자 모델 import

// [GET] 댓글 불러오기
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment
      .find({ postId: req.params.postId, parentComment: null })
      .sort({ createdAt: 1 }) // 최신순 or 오래된순 정렬
      .populate('author', 'nickname profileImage') // ✅ 최신 프로필 가져오기
      .lean();

    for (let c of comments) {
      const replies = await Comment
        .find({ parentComment: c._id })
        .populate('author', 'nickname profileImage')
        .lean();
      c.replies = replies;
    }
    
    return res.json({ success: true, comments });
  } catch (err) {
    console.error('❌ 댓글 조회 실패:', err);
    res.status(500).json({ success: false, message: '서버 에러' });
  }
});

// [DELETE] 댓글 삭제
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    // 해당 댓글 존재 여부 확인
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: '댓글이 존재하지 않습니다.' });
    }

    // 삭제 수행
    await Comment.findByIdAndDelete(commentId);
    res.json({ success: true, message: '댓글이 삭제되었습니다.' });
  } catch (err) {
    console.error('❌ 댓글 삭제 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// [PATCH] 댓글 수정
router.patch('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    console.log('🔧 [PATCH] commentId param:', commentId);
    const existing = await Comment.findById(commentId);
    console.log('🔧 [PATCH] existing comment:', existing);

    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: '내용이 비어있습니다.' });
    }

    const updated = await Comment.findByIdAndUpdate(
      commentId,
      { content },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' });
    }

    res.json({ success: true, comment: updated });
  } catch (err) {
    console.error('❌ 댓글 수정 실패:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 댓글/대댓글 생성
router.post('/', async (req, res) => {
  try {
    console.log('📥 대댓글 요청 body:', req.body); // ← 요청 내용 확인

    const { postId, author, content, parentComment, nickname, userId, profileImage } = req.body;

    // 예외 처리 로그
    if (!postId || !author || !content) {
      console.log('❌ 필수값 누락:', { postId, author, content });
      return res.status(400).json({ error: 'postId, author, content는 필수입니다.' });
    }

    const comment = new Comment({
      postId,
      author,
      content,
      parentComment: parentComment || null,
      nickname,
      userId,
      profileImage,
    });

    await comment.save();

    const populated = await comment.populate('author', 'nickname profileImage');

    res.status(201).json({ comment: populated });
  } catch (err) {
    console.error('❌ 댓글 저장 실패:', err); // ← 여기 반드시 필요!
    res.status(500).json({ error: '서버 에러', detail: err.message });
  }
});



// [POST] 댓글 작성
router.post('/', async (req, res) => {
  const { postId, userId, content, author, nickname } = req.body;

  console.log('💬 댓글 요청 데이터:', { postId, userId, content, author, nickname });
  if (!postId || !userId || !content || !author || !nickname) {
    return res.status(400).json({ success: false, message: '필수 항목 누락' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자 정보 없음' });
    }

    const newComment = await Comment.create({
      postId,
      userId: user._id.toString(),
      author: user._id,
      content,
      profileImage: user.profileImage || '', // 있으면 같이 넣기

      nickname,
    });

    const populatedComment = await Comment.findById(newComment._id)
      .populate('author', 'nickname profileImage')
      .lean();

    res.status(201).json({ success: true, comment: populatedComment });
  } catch (err) {
    console.error('❌ 댓글 작성 실패:', err);
    res.status(500).json({ success: false, message: '서버 에러' });
  }
});

module.exports = router;