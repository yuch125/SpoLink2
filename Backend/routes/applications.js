// routes/applications.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const ChatRoom = require('../models/ChatRoom');
const Application = require('../models/Application');


// 상단 require들 아래에 추가
const toId = (v) => (typeof v === 'string' ? new mongoose.Types.ObjectId(v) : v);

function recomputeCounts(postDoc) {
  const acceptedCnt = (postDoc.applicants || []).filter(a => a.accepted === true).length;
  const participantCount = 1 + acceptedCnt; // 주최자 포함
  const isFull = !!postDoc.maxParticipants && participantCount >= postDoc.maxParticipants;
  return { acceptedCnt, participantCount, isFull };
}

function emitParticipantsUpdated(postDoc, participantCount, isFull) {
  if (ioRef) {
    ioRef.emit('post:participantsUpdated', {
      postId: String(postDoc._id),
      participantCount,
      maxParticipants: postDoc.maxParticipants || 0,
      isFull,
    });
  }
}

let ioRef = null;
router.setIo = (io) => { ioRef = io; };

// 1. 참가 신청 생성
router.post('/', async (req, res) => {
  console.log('🔥 신청 요청:', req.body);
  const { userId, nickname, postId } = req.body;
  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: '모집글이 없습니다.' });

    // Post 기준 현재 정원 체크
    const { participantCount, isFull } = recomputeCounts(post);
    if (isFull) return res.status(400).json({ error: '정원이 이미 가득 찼습니다.' });

    // Application 중복 신청 방지
    const existsApp = await Application.findOne({ 'applicant.userId': userId, post: postId });
    if (existsApp) return res.status(400).json({ error: '이미 신청했습니다' });

    // Post.applicants 중복 신청 방지(대기/수락 모두)
    const existsInPost = (post.applicants || []).some(a => String(a.userId) === String(userId));
    if (existsInPost) return res.status(400).json({ error: '이미 신청했습니다' });

    const newApp = new Application({
      applicant: { userId, nickname },
      post: postId,
      status: 'pending',
    });
    await newApp.save();

    return res.status(201).json({ success: true, application: newApp });
  } catch (err) {
    console.error('❌ 참가 신청 오류:', err);
    return res.status(500).json({ error: '서버 오류 - 신청 실패' });
  }
});


// 2. 특정 유저가 신청한 목록 조회 (마이페이지)
// ✅ /applications?userId=...  사용
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId가 필요합니다.' });

    const apps = await Application.find({ 'applicant.userId': userId })
      .populate({
        path: 'post',
        populate: { path: 'writer', select: 'userId nickname profileImage' }
      })
      .lean();

    return res.json(apps);
  } catch (err) {
    console.error('❌ 신청 목록 조회 오류:', err);
    return res.status(500).json({ error: '서버 오류 - 신청 목록 조회 실패' });
  }
});


// 3. 특정 모집글의 신청자 목록 조회 (모집 주최자용)
// ...상단 require 생략

// GET /applications/post/:postId
// 신청 목록 조회
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const applications = await Application.find({ post: postId })
      .populate('applicant.userId', 'nickname trustScore profileImage ageGroup');

    // 프론트에서 쓰기 편하게 applicant 구조를 평탄화
    const formatted = applications.map(app => ({
      _id: app._id,
      status: app.status,
      applicant: {
        _id: app.applicant.userId._id,
        nickname: app.applicant.userId.nickname,
        trustScore: app.applicant.userId.trustScore,
        profileImage: app.applicant.userId.profileImage,
        ageGroup: app.applicant.userId.ageGroup,
      },
    }));

    res.json(formatted);
  } catch (err) {
    console.error('❌ 신청 목록 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});



// 4. 참가 신청 수락 + 채팅방 자동 생성
router.patch('/:id/accept', async (req, res) => {
  console.log('▶️ [applications] accept 핸들러 진입, applicationId =', req.params.id);
  try {
    const application = await Application
      .findById(req.params.id)
      .populate({ path: 'post', populate: { path: 'writer', model: 'User', select: '_id nickname' } });

    if (!application) return res.status(404).json({ error: '해당 신청을 찾을 수 없습니다' });

    const post = await Post.findById(application.post._id);
    if (!post) return res.status(404).json({ error: '모집글이 없습니다.' });

    // 수락 전 정원 체크(현재 상태 기준)
    const before = recomputeCounts(post);
    if (before.isFull) return res.status(400).json({ error: '정원이 이미 가득 찼습니다.' });

    // ===== 채팅방 생성/참가 =====
    let chatRoom = await ChatRoom.findOne({ postId: application.post._id });
    if (!chatRoom) {
      const hostId = application.post.writer._id;
      const hostNick = application.post.writer.nickname;
      const appId = toId(application.applicant.userId);
      const appNick = application.applicant.nickname;

      chatRoom = await ChatRoom.create({
        postId: application.post._id,
        title: application.post.content,
        participants: [
          { userId: hostId, nickname: hostNick },
          { userId: appId, nickname: appNick },
        ],
      });
      console.log('▶️ 채팅방 생성 완료:', chatRoom._id);
    } else {
      const exists = chatRoom.participants.some(
        p => String(p.userId) === String(application.applicant.userId)
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
    application.status = 'accepted';
    application.acceptedAt = new Date(); // 있으면 좋음
    await application.save();


    // ===== Post.applicants 동기화 (진실 소스: Post) =====
    // [A-1] 포스트의 신청자 목록에 'accepted' 반영 (없으면 추가)
    const targetId = application.applicant.userId;
    const idx = (post.applicants || []).findIndex(a => String(a.userId) === String(targetId));
    if (idx >= 0) {
      post.applicants[idx].accepted = true;
    } else {
      post.applicants.push({ userId: targetId, accepted: true });
    }

    // [A-2] 인원 수 재계산 & 저장
    const after = recomputeCounts(post); // { participantCount, isFull } 계산하는 너의 유틸
    post.participantCount = after.participantCount;
    post.isFull = !!after.isFull;
    await post.save();

    // [A-3] 소켓 브로드캐스트 (헤더 실시간 갱신용)
    const io = (global.ioRef) || req.app.get('io');
    if (io) {
      io.emit('post:participantsUpdated', {
        postId: String(post._id),
        participantCount: post.participantCount,
        maxParticipants: post.maxParticipants,
        isFull: post.isFull,
      });
    }

    // [A-4] 응답을 풍부하게 (클라에서 헤더 초기 세팅에 사용)
    return res.json({
      ok: true,
      chatRoomId: chatRoom._id,
      postId: post._id,
      title: post.content, // 제목으로 content를 쓰고 있으면 그대로
      participantCount: post.participantCount,
      maxParticipants: post.maxParticipants,
      isFull: post.isFull,
    });
  } catch (err) {
    console.error('❌ 수락 처리 오류:', err);
    return res.status(500).json({ error: '서버 오류 - 수락 실패' });
  }
});


// 5. 참가 신청 거절
router.patch('/:id/reject', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('post');
    if (!application) return res.status(404).json({ error: '해당 신청을 찾을 수 없습니다' });

    const post = await Post.findById(application.post._id);
    if (!post) return res.status(404).json({ error: '모집글이 없습니다.' });

    application.status = 'rejected';
    await application.save();

    // Post.applicants에서 accepted=false 로 반영
    const uid = String(application.applicant.userId);
    const idx = (post.applicants || []).findIndex(a => String(a.userId) === uid);
    if (idx >= 0) post.applicants[idx].accepted = false;

    const { participantCount, isFull } = recomputeCounts(post);
    post.isFull = isFull;
    await post.save();

    emitParticipantsUpdated(post, participantCount, isFull);

    return res.json({
      success: true,
      postId: String(post._id),
      participantCount,
      maxParticipants: post.maxParticipants,
      isFull,
    });
  } catch (err) {
    console.error('❌ 거절 처리 오류:', err);
    return res.status(500).json({ error: '서버 오류 - 거절 실패' });
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