console.log('▶️ applications 라우터 로드됨');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Application = require('../models/Application');
const ChatRoom = require('../models/ChatRoom');

// 1. 참가 신청 생성
router.post('/', async (req, res) => {
  console.log('🔥 신청 요청:', req.body);
  const { userId, nickname, postId } = req.body;
  try {
    // 중복 신청 방지
    const exists = await Application.findOne({
      'applicant.userId': userId,
      post: postId,
    });
    if (exists) {
      return res.status(400).json({ error: '이미 신청했습니다' });
    }
    const newApp = new Application({
      applicant: { userId, nickname },
      post: postId,
    });
    await newApp.save();
    res.status(201).json({ success: true, application: newApp });
  } catch (err) {
    console.error('❌ 참가 신청 오류:', err);
    res.status(500).json({ error: '서버 오류 - 신청 실패' });
  }
});

// 2. 특정 유저가 신청한 목록 조회 (마이페이지)
router.get('/', async (req, res) => {
  const { userId } = req.query;
  try {
    const application = await Application.find(req.params.id)
      .populate({
        path: 'post',
        populate: {
          path: 'writer', // Post.writer가 User를 참조하고 있어야 함
          select: 'userId nickname', // 필요한 필드만 가져오기
        }
      });
    res.json(application);
  } catch (err) {
    console.error('❌ 신청 목록 조회 오류:', err);
    res.status(500).json({ error: '서버 오류 - 신청 목록 조회 실패' });
  }
});

// 3. 특정 모집글의 신청자 목록 조회 (모집 주최자용)
router.get('/post/:postId', async (req, res) => {
  try {
    const postId = new mongoose.Types.ObjectId(req.params.postId);
    const applications = await Application.find({ post: postId });
    console.log('▶️ 신청자 목록 payload:', applications.map(app => app.applicant.nickname));
    const formatted = applications.map(app => ({
      _id: app._id,
      status: app.status,
      applicant: app.applicant,
    }));
    res.json(formatted);
  } catch (err) {
    console.error('❌ 모집글 신청자 목록 조회 오류:', err);
    res.status(500).json({ error: '서버 오류 - 신청자 목록 조회 실패' });
  }
});

// 4. 참가 신청 수락 + 채팅방 자동 생성
router.patch('/:id/accept', async (req, res) => {
  console.log('▶️ [applications] accept 핸들러 진입, applicationId =', req.params.id);
  try {
    const application = await Application.findById(req.params.id).populate('post');
    if (!application) {
      return res.status(404).json({ error: '해당 신청을 찾을 수 없습니다' });
    }
    application.status = 'accepted';

    // 기존 채팅방 조회
    let chatRoom = await ChatRoom.findOne({ postId: application.post._id });

    if (!chatRoom) {
      // 새 채팅방 생성
      chatRoom = await ChatRoom.create({
        postId: application.post._id,
        title: application.post.content,
        participants: [
          { userId: String(application.post.writer.userId), nickname: application.post.writer.nickname },
          { userId: String(application.applicant.userId), nickname: application.applicant.nickname },
        ],
      });
      console.log('▶️ 채팅방 생성 완료:', chatRoom._id);
    } else {
      // 참가자 추가
      const exists = chatRoom.participants.some(
        p => p.userId.toString() === application.applicant.userId.toString()
      );
      if (!exists) {
        chatRoom.participants.push({
          userId: String(application.applicant.userId),
          nickname: application.applicant.nickname,
        });
        await chatRoom.save();
        console.log('▶️ 참가자 추가 완료:', application.applicant.userId);
      } else {
        console.log('▶️ 이미 참가자 포함, 추가 스킵');
      }
    }

    application.chatRoomId = chatRoom._id;
    await application.save();

    res.json({ success: true, chatRoomId: chatRoom._id });
  } catch (err) {
    console.error('❌ 수락 처리 오류:', err);
    res.status(500).json({ error: '서버 오류 - 수락 실패' });
  }
});

// 5. 참가 신청 거절
router.patch('/:id/reject', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: '해당 신청을 찾을 수 없습니다' });
    }
    application.status = 'rejected';
    await application.save();
    res.json({ success: true });
  } catch (err) {
    console.error('❌ 거절 처리 오류:', err);
    res.status(500).json({ error: '서버 오류 - 거절 실패' });
  }
});

module.exports = router;