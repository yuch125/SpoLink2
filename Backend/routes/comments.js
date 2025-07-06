const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");

// [GET] /comments/:postId - 특정 게시물의 댓글 가져오기
router.get("/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: 1 });
    res.json({ success: true, comments });
  } catch (err) {
    res.status(500).json({ success: false, message: "댓글 목록 조회 실패", error: err.message });
  }
});

// [POST] /comments - 댓글 작성
router.post("/", async (req, res) => {
  const { postId, userId, nickname, content } = req.body;

  try {
    const comment = new Comment({ postId, userId, nickname, content });
    await comment.save();
    res.status(201).json({ success: true, message: "댓글 작성 완료", comment });
  } catch (err) {
    res.status(400).json({ success: false, message: "댓글 작성 실패", error: err.message });
  }
});

// [DELETE] /comments/:id - 댓글 삭제
router.delete("/:id", async (req, res) => {
  const { userId } = req.body;

  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: "댓글을 찾을 수 없음" });
    }
    if (comment.userId !== userId) {
      return res.status(403).json({ success: false, message: "삭제 권한 없음" });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ success: false, message: "댓글 삭제 실패", error: err.message });
  }
});

module.exports = router;
