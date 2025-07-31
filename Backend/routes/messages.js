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
    const messages = await Message.find({ roomId: roomObjectId }).sort({createdAt : 1}).populate('sender', 'nickname profileImage');
    res.json(messages);
  } catch (err) {
    console.error('❌ 메시지 조회 오류:', err); // 디버깅용 로그
    res.status(500).json({ error: '메시지 로드 실패' });
  }
});

// ——— 4) 메시지 전송 ———
// POST /chat/:roomId
router.post('/:roomId', async (req, res) => {
  const { senderId, content } = req.body;
  if (!senderId || !content) {
    return res.status(400).json({ error: 'senderId, content 모두 필요합니다.' });
  }
  try {
    const roomObjectId = new mongoose.Types.ObjectId(req.params.roomId);
    const msg = await Message.create({
      roomId: roomObjectId,
      sender: new mongoose.Types.ObjectId(senderId),
      content,
      readBy: []
    });
    res.status(201).json(msg);
  } catch (err) {
    console.error('❌ 메시지 생성 오류:', err);
    res.status(500).json({ error: '메시지 생성 실패' });
  }
});

// ——— 5) 읽음 표시 ———
// PATCH /chat/:roomId/:messageId/read
router.patch('/:roomId/:messageId/read', async (req, res) => {
  const { messageId } = req.params;
  const { userId }     = req.body;
  if (!userId) return res.status(400).json({ error: 'userId가 필요합니다.' });

  try {
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { readBy: new mongoose.Types.ObjectId(userId) }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('❌ 읽음 표시 오류:', err);
    res.status(500).json({ error: '읽음 표시 실패' });
  }
});

// ——— 6) 메시지 수정 ———
// PATCH /chat/:roomId/:messageId
router.patch('/:roomId/:messageId', async (req, res) => {
  const { messageId }       = req.params;
  const { userId, content } = req.body;
  if (!userId || !content) return res.status(400).json({ error: 'userId, content 필요' });

  try {
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: '메시지 없음' });
    if (msg.sender.toString() !== userId) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }
    msg.content   = content;
    msg.updatedAt = new Date();
    await msg.save();
    res.json(msg);
  } catch (err) {
    console.error('❌ 메시지 수정 오류:', err);
    res.status(500).json({ error: '메시지 수정 실패' });
  }
});

// ——— 7) 메시지 삭제 ———
// DELETE /chat/:roomId/:messageId
router.delete('/:roomId/:messageId', async (req, res) => {
  const { messageId } = req.params;
  const { userId }    = req.body;
  if (!userId) return res.status(400).json({ error: 'userId 필요' });

  try {
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ error: '메시지 없음' });
    if (msg.sender.toString() !== userId) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }
    await msg.remove();
    res.json({ success: true });
  } catch (err) {
    console.error('❌ 메시지 삭제 오류:', err);
    res.status(500).json({ error: '메시지 삭제 실패' });
  }
});

module.exports = router;

