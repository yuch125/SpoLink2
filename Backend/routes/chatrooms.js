const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const Post = require('../models/Post');
const User = require('../models/User')
// ─────────────────────────────────────────────
// 1) 유저가 속한 방 목록 조회
// GET /chatrooms/room/:roomId  -> postId, 현재/최대 인원
router.get('/room/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const room = await ChatRoom.findById(roomId)
    .populate('postId', 'maxParticipants')
    .lean();

  if (!room) return res.status(404).json({ error: 'room not found' });

  const participantCount = Array.isArray(room.participants) ? room.participants.length : 0;
  const maxParticipants =
    room.postId && typeof room.postId.maxParticipants === 'number'
      ? room.postId.maxParticipants
      : 0;
  const postId =
    room.postId && room.postId._id ? room.postId._id.toString() : null;

  return res.json({
    participants,
    postId: room.postId && room.postId._id ? room.postId._id.toString() : null,
    maxParticipants:
      room.postId && typeof room.postId.maxParticipants === 'number'
        ? room.postId.maxParticipants
        : 0,
  });

});

// GET /chatrooms/:userId
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'userId가 필요합니다' });
  }

  try {
    const rooms = await ChatRoom.find({ 'participants.userId': userId })
      .populate('postId', 'content maxParticipants')
      .lean();

    const result = await Promise.all(
      rooms.map(async (room) => {
        const lastMsg = await Message.findOne({ roomId: room._id })
          .sort({ createdAt: -1 })
          .lean();

        // ✅ optional chaining 없이 안전하게
        const postId =
          room.postId && room.postId._id ? room.postId._id.toString() : null;
        const postTitle =
          room.postId && typeof room.postId.content === 'string'
            ? room.postId.content
            : '모임';
        const participantCount = Array.isArray(room.participants)
          ? room.participants.length
          : 0;
        const maxParticipants =
          room.postId && typeof room.postId.maxParticipants === 'number'
            ? room.postId.maxParticipants
            : 0;
        const lastMessage =
          lastMsg && typeof lastMsg.content === 'string'
            ? lastMsg.content
            : '메시지가 없습니다';
        const updatedAt =
          (lastMsg && lastMsg.createdAt) ? lastMsg.createdAt : room.updatedAt;

        return {
          _id: room._id.toString(),
          postId,                 // 🔹 이제 항상 포함(없으면 null)
          postTitle,
          participantCount,
          maxParticipants,
          lastMessage,
          updatedAt,
        };
      })
    );

    result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return res.json(result);
  } catch (err) {
    console.error('❌ 채팅방 목록 조회 실패:', err);
    return res.status(500).json({ error: '채팅방 목록 조회 실패' });
  }
});


// 참가자 목록 조회: GET /chatrooms/:roomId/participants
router.get('/:roomId/participants', async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await ChatRoom.findById(roomId)
    .populate('postId', 'maxParticipants') // 👈 모집글 정원 정보까지 가져오기
    .lean();    if (!room) return res.status(404).json({ error: '채팅방 없음' });

    const raw = Array.isArray(room.participants) ? room.participants : [];

    // ObjectId 변환 오류 방지: falsy 제거
    const userIds = raw.map(p => p.userId).filter(Boolean);

    const users = await User.find({ _id: { $in: userIds } })
      .select('_id nickname profileImage')
      .lean();

    const uMap = new Map(users.map(u => [String(u._id), u]));

    const participants = raw.map(p => {
      const key = String(p.userId);
      const u = uMap.get(key);
      return {
        _id: key,
        userId: key,
        nickname: u?.nickname ?? p.nickname ?? '알수없음',
        profileImage: u?.profileImage ?? null,
      };
    });

    return res.json({
      participants,
      postId: room.postId?._id?.toString() || null, // 🔹 추가
      maxParticipants: room.postId?.maxParticipants ?? 0, // (
    });
  } catch (e) {
    console.error('GET /chatrooms/:roomId/participants error:', e);
    return res.status(500).json({ error: '서버 오류', detail: e.message });
  }
});



module.exports = router;

