const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const Post = require('../models/Post');

// [GET] /chatrooms/:userId - 특정 유저의 채팅방 목록 조회
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('✅ 채팅방 목록 요청 userId:', userId);

  if (!userId) {
    return res.status(400).json({ error: 'userId가 필요합니다' });
  }

  try {
    // 1. 유저가 참여한 채팅방 조회
    const rooms = await ChatRoom.find({ 'participants.userId': userId })
      .populate('postId')
      .lean();

    console.log('▶️ 찾은 채팅방 수:', rooms.length);

    // 2. 각 채팅방의 마지막 메시지 포함하여 가공
    const result = await Promise.all(
      rooms.map(async (room) => {
        const lastMsg = await Message.findOne({ roomId: room._id })
          .sort({ createdAt: -1 })
          .lean();

        return {
          _id: room._id,
          postTitle: room.postId?.content || '모임',
          lastMessage: lastMsg?.content || '메시지가 없습니다',
          updatedAt: lastMsg?.createdAt || room.updatedAt,
        };
      })
    );

    // 3. 최신순 정렬
    result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json(result);
  } catch (err) {
    console.error('❌ 채팅방 목록 조회 실패:', err);
    res.status(500).json({ error: '채팅방 목록 조회 실패' });
  }
});

module.exports = router;
