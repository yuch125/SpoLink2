const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/Post'); 
const User    = require('../models/User');
// 모집 카드 생성
router.post('/', async (req, res) => {
  try {
    console.log('▶▶▶ /posts POST 진입');
    console.log('📥 받은 요청 데이터:', req.body);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const { category, content, time, location, detail, writer, maxParticipants, locationName } = req.body;
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
      time,
      location,
      locationName,
      detail,
      writer: new mongoose.Types.ObjectId(writer), // ✅ 여기!
      participants: 0,
      maxParticipants: maxParticipants || 12,
      expiresAt,
      writerNickname: user.nickname,         
    });

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
  const { lng, lat, writer } = req.query;
  try {
    // 1) GeoNear 로 위치 기반 정렬
    if (lng && lat) {
      const posts = await Post.aggregate([
        {
          $geoNear: {
            near:    { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: 'dist',
            spherical:     true,
          }
        },
        { $sort: { dist: 1, createdAt: -1 } }
      ]);
      return res.json(posts);
    }

    // 2) 일반 조회: writer 쿼리 있으면 필터, 없으면 전체
    const filter = {};
    if (writer) {
      filter.writer = new mongoose.Types.ObjectId(req.query.writer);
    }
    

    const posts = await Post.find(filter)
      .select('+locationName')
      .populate('writer', 'userId nickname profileImage')
      .sort({ createdAt: -1 })
      .lean();

    return res.json(posts);
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

    const alreadyApplied = post.applicants.some(app => app.userId === userId);
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

    const applicant = post.applicants.find(a => a.userId === userId);
    if (!applicant) return res.status(404).json({ error: '신청자 없음' });

    applicant.accepted = accepted;
    await post.save();

    res.json({ message: `✅ ${accepted ? '수락' : '거절'} 처리 완료` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;