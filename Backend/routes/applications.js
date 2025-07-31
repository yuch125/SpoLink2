// routes/applications.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const ChatRoom = require('../models/ChatRoom');
const Application = require('../models/Application');

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

router.get('/', async (req, res) => {
  try {
    const filter = {};
    // 쿼리스트링에 writer가 있으면, ObjectId로 바꿔서 필터에 추가
    if (req.query.writer) {
      filter.writer = mongoose.Types.ObjectId(req.query.writer);
    }
    // status나 expiresAt 같은 추가 필터가 필요하면 여기에 더 추가
    const posts = await Post.find(filter)
      .populate('writer', 'userId nickname profileImage');
    res.json(posts);
  } catch (err) {
    console.error('GET /posts error', err);
    res.status(500).json({ error: '게시글 조회에 실패했습니다.' });
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
    const application = await Application
      .findById(req.params.id)
      .populate({
        path: 'post',
        populate: { path: 'writer', model: 'User', select: '_id nickname' }
      });
    if (!application) {
      return res.status(404).json({ error: '해당 신청을 찾을 수 없습니다' });
    }
    application.status = 'accepted';

    // 기존 채팅방 조회
    let chatRoom = await ChatRoom.findOne({ postId: application.post._id });

    if (!chatRoom) {

      const hostId = application.post.writer._id;          // ← 반드시 _id
      const hostNick = application.post.writer.nickname;     // ← populate에서 가져온 닉네임
      // ✅ new를 붙여서 호출하세요
      const appId = new mongoose.Types.ObjectId(application.applicant.userId);
      const appNick = application.applicant.nickname;

      // 새 채팅방 생성
      chatRoom = await ChatRoom.create({
        postId: application.post._id,
        title: application.post.content,
        participants: [
          { userId: hostId, nickname: hostNick },
          { userId: appId, nickname: appNick }
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
          userId: application.applicant.userId,
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

router.get('/:userId/applications', async (req, res) => {
  try {
    const { userId } = req.params;
    const apps = await Application
      .find({ 'applicant.userId': userId, status: 'accepted' })  // ← 이렇게
      .populate({
        path: 'post',
        populate: { 
          path: 'writer', 
          select: 'userId nickname profileImage' 
        }
      });
    const posts = apps.map(a => a.post);
    return res.json(posts);
  } catch (err) {
    console.error('참가 모임 조회 오류', err);
    return res.status(500).json({ error: '참가 모임을 불러올 수 없습니다.' });
  }
});





module.exports = router;