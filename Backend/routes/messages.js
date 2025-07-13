const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const mongoose = require('mongoose'); // 꼭 필요함
// 📌 1. 특정 userId가 포함된 채팅방 리스트 조회 (내 채팅방들)
router.get('/my/:userId', async (req, res) => {
  try {
    const chatRooms = await ChatRoom.find({ participants: req.params.userId }).populate('post');
    res.json(chatRooms);
  } catch (err) {
    console.error('❌ 채팅방 조회 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📌 2. 특정 모집글(postId)에 대한 채팅방 1개 조회 (중복 방지용)
router.get('/post/:postId', async (req, res) => {
  try {
    const chatRoom = await ChatRoom.findOne({ postId: req.params.postId });
    if (!chatRoom) return res.status(404).json({ error: '채팅방 없음' });
    res.json(chatRoom);
  } catch (err) {
    console.error('❌ 채팅방 조회 오류:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3.메시지 불러오기
router.get('/:roomId', async (req, res) => {
  try {
    const roomObjectId = new mongoose.Types.ObjectId(req.params.roomId); // 이 줄 추가!
    const messages = await Message.find({ roomId: roomObjectId }).sort('createdAt');
    res.json(messages);
  } catch (err) {
    console.error('❌ 메시지 조회 오류:', err); // 디버깅용 로그
    res.status(500).json({ error: '메시지 로드 실패' });
  }
});

module.exports = router;
