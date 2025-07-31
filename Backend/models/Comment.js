// models/Comment.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const commentSchema = new Schema({
  postId:       { type: Schema.Types.ObjectId, ref: "Post", required: true },
  author:       { type: Schema.Types.ObjectId, ref: "User", required: true },
  userId:       { type: String, required: true },
  nickname:     { type: String, required: true },
  profileImage: { type: String },
  content:      { type: String, required: true },
  parentComment: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },  // ← 추가

}, {
  timestamps: true  // ← 이 옵션을 추가하세요
});

module.exports = mongoose.models.Comment || mongoose.model("Comment", commentSchema);

// postId	댓글이 달린 게시물
// author	User 모델의 참조 ID
// userId	사용자의 고유 ID (author._id를 복제한 형태)
// nickname (optional)	닉네임을 저장하고 싶으면 따로 넣어야 함
// profileImage	사용자 아바타 이미지 URL
// content	댓글 내용
// createdAt	생성 시간