// posts.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment')
const Application = require('../models/Application')
// 모집 카드 생성
router.post('/', async (req, res) => {
  try {
    console.log('▶▶▶ /posts POST 진입');
    console.log('📥 받은 요청 데이터:', req.body);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const { 
      category, 
      content, 
      startTime, 
      endTime, 
      location, 
      detail, 
      writer, 
      maxParticipants, 
      locationName,
      preferredAgeGroups,
      locationDistance, // ✅ 추가
    } = req.body;

    console.log('📍 locationName 도착:', locationName); // 🔍 여기

    if (!writer) {
      return res.status(400).json({ error: '작성자 정보가 필요합니다.' });
    }

    // 1) 작성자 User 정보 조회
    const user = await User.findById(writer);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }


    const post = new Post({
      category,
      content,
      startTime,
      endTime,
      location,
      locationName,
      locationDistance,
      detail,
      writer: new mongoose.Types.ObjectId(writer), // ✅ 여기!
      maxParticipants: maxParticipants || 12,
      expiresAt,
      writerNickname: user.nickname,
      preferredAgeGroups: Array.isArray(preferredAgeGroups) && preferredAgeGroups.length
      ? preferredAgeGroups.slice(0, 2)   // 안전하게 2개 제한
      : ['상관없음'],    });

    console.log('🟡 저장 전 participantCount:', post.participantCount);


    const saved = await post.save();
    console.log('✅ 저장된 데이터:', saved);
    res.status(201).json(saved);
  } catch (err) {
    console.error('❌ 저장 실패:', err);
    res.status(400).json({ error: err.message });
  }
});

// 모집 카드 전체 조회
router.get('/', async (req, res) => {
  const { lng, lat, writer, userId } = req.query;
  try {
    // 1️⃣ 위치 기반 정렬 (GeoNear)
    if (lng && lat) {
      const posts = await Post.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: 'dist',
            spherical: true,
          }
        },
        {
          $addFields: {
            participantCount: {
              $add: [
                1,
                {
                  $size: {
                    $filter: {
                      input: '$applicants',
                      as: 'a',
                      cond: { $eq: ['$$a.accepted', true] }
                    }
                  }
                }
              ]
            },
            isFull: { $gte: ['$participantCount', '$maxParticipants'] }
          }
        },
        { $sort: { dist: 1, createdAt: -1 } }
      ]);

      // 🔹 댓글 수 계산
      const postsWithComment = await Promise.all(
        posts.map(async (post) => {
          const count = await Comment.countDocuments({ postId: post._id });
          return { ...post, commentCount: count };
        })
      );

      // 🔹 writer 정보 수동 채우기
      const postsWithWriter = await Promise.all(
        postsWithComment.map(async (post) => {
          const user = await User.findById(post.writer).select('userId nickname profileImage');
          let myApplicationStatus = null;
          if (userId) {
            const app = await Application.findOne({
              post: post._id,
              'applicant.userId': userId
            }).lean();
            if (app) myApplicationStatus = app.status;
          }          
          return {
            ...post,
            writer: user
              ? {
                _id: user._id,
                userId: user.userId,
                nickname: user.nickname,
                profileImage: user.profileImage,
              }
              : post.writer, // 못 찾으면 원래 ObjectId 그대로
              myApplicationStatus
          };
        })
      );

      return res.json(postsWithWriter);
    }

// 2️⃣ 일반 조회 (위치 없음)
const filter = {};
if (writer) {
  filter.writer = new mongoose.Types.ObjectId(writer);
}

// 1) Mongoose Document로 가져온 뒤
const docs = await Post.find(filter)
  .select('+locationName')
  .populate('writer', 'userId nickname profileImage')
  .sort({ createdAt: -1 });

// 2) virtual 포함해서 순수 객체로 변환
const posts = docs.map(d => d.toObject({ virtuals: true }));

// 3) 🔥 Post.applicants 기준으로 participantCount / isFull / commentCount 주입
const postsEnriched = await Promise.all(
  posts.map(async (post) => {
    const acceptedCount = (post.applicants || []).filter(a => a?.accepted === true).length;
    const participantCount = 1 + acceptedCount; // 주최자 포함
    const isFull = post.maxParticipants ? participantCount >= post.maxParticipants : false;
    const commentCount = await Comment.countDocuments({ postId: post._id });
    let myApplicationStatus = null;
    if (userId) {
      const app = await Application.findOne({
        post: post._id,
        'applicant.userId': userId
      }).lean();
      if (app) myApplicationStatus = app.status;
    }
    return { ...post, participantCount, isFull, commentCount, myApplicationStatus};
  })
);

return res.json(postsEnriched);

  } catch (err) {
    console.error('❌ GET /posts error', err);
    return res.status(500).json({ error: '게시글 조회에 실패했습니다.' });
  }
});



// 모집 카드 삭제
router.delete('/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: '삭제 실패' });
  }
});

// 모집 카드 수정 (location 안전 처리)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // location이 없거나 잘못된 경우 기존 location 유지
    if (!updateData.location || !updateData.location.coordinates) {
      delete updateData.location;
    }

    // locationName도 마찬가지
    if (!updateData.locationName) {
      delete updateData.locationName;
    }

    const updated = await Post.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate('writer', 'nickname profileImage');

    if (!updated) return res.status(404).json({ error: 'Post not found' });
    res.json(updated);
  } catch (err) {
    console.error('❌ 수정 오류:', err);
    res.status(500).json({ error: '수정 실패' });
  }
});


// 참가 신청
router.post('/apply', async (req, res) => {
  const { postId, userId } = req.body;

  if (!postId || !userId) {
    return res.status(400).json({ error: 'postId나 userId가 필요합니다.' });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: '모집글이 없습니다.' });

    if (!post.applicants) post.applicants = [];

    // ✅ 현재 참가 인원 수 계산 (주최자 포함)
    const acceptedCount = (post.applicants || []).filter(a => a.accepted === true).length;
    const participantCount = 1 + acceptedCount;
    if (participantCount >= post.maxParticipants) {
      return res.status(400).json({ error: '정원이 이미 가득 찼습니다.' });
    }

    // ✅ 안전한 ObjectId 비교
    const alreadyApplied = post.applicants.some(app => String(app.userId) === String(userId));
    if (alreadyApplied) {
      return res.status(400).json({ error: '이미 신청했습니다.' });
    }

    post.applicants.push({ userId, accepted: false });
    await post.save();

    res.json({ message: '✅ 참가 신청 완료!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});


// 참가 수락/거절
router.post('/apply/respond', async (req, res) => {
  const { postId, userId, accepted } = req.body;

  if (!postId || !userId || typeof accepted !== 'boolean') {
    return res.status(400).json({ error: '필수 정보 누락' });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: '모집글 없음' });

    // 현재 확정 참가자 수(주최자 포함)
    const acceptedCnt = (post.applicants || []).filter(a => a.accepted === true).length;
    const participantCountBefore = 1 + acceptedCnt;

    // 수락하려는 경우 정원 체크
    if (accepted && participantCountBefore >= post.maxParticipants) {
      return res.status(400).json({ error: '정원이 이미 가득 찼습니다.' });
    }

    // 신청자 찾기 (ObjectId 안전 비교)
    const applicant = (post.applicants || []).find(a => String(a.userId) === String(userId));
    if (!applicant) return res.status(404).json({ error: '신청자 없음' });

    // 이미 수락된 상태에서 또 수락 요청 시, 현재 상태만 브로드캐스트
    if (accepted && applicant.accepted === true) {
      const io = req.app.get('io');
      if (io) {
        const participantCount = 1 + (post.applicants || []).filter(a => a.accepted === true).length;
        io.emit('post:participantsUpdated', {
          postId: String(post._id),
          participantCount,
          maxParticipants: post.maxParticipants,
          isFull: participantCount >= post.maxParticipants,
        });
      }
      return res.json({ message: '이미 수락된 신청자', repeated: true });
    }

    // 수락/거절 반영
    applicant.accepted = accepted;

    // 저장 이후 최신 카운트 계산
    const participantCount = 1 + (post.applicants || []).filter(a => a.accepted === true).length;
    post.participantCount = participantCount; // ✅ DB에도 저장
    post.isFull = participantCount >= post.maxParticipants; // ✅ isFull도 업데이트
    console.log('🟢 수락 처리 후 인원 수:', participantCount);
    console.log('🟢 post.participantCount 저장 전:', post.participantCount);
    await post.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('post:participantsUpdated', {
        postId: String(post._id),
        participantCount,
        maxParticipants: post.maxParticipants,
        isFull: post.isFull,
      });
    }


    res.json({
      message: `✅ ${accepted ? '수락' : '거절'} 처리 완료`,
      participantCount,
      maxParticipants: post.maxParticipants,
      isFull: participantCount >= post.maxParticipants,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});


module.exports = router;