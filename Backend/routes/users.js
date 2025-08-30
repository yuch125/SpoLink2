const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Application = require('../models/Application')
const mongoose = require('mongoose');// 1) 사용자 정보 조회
const ChatRoom = require('../models/ChatRoom'); // 모임 참가 통계용

// ── 나이 숫자 → ageGroup 매핑
const normalizeAgeGroup = require('../utils/normalizeAgeGroup');
const ALLOWED_AGE_GROUPS = ['중1', '중2', '중3', '고1', '고2', '고3', '대학생', '기타'];
function toAgeGroup(age) {
  const n = parseInt(age, 10);
  if (Number.isNaN(n)) return undefined;

  if (n === 13) return '중1';
  if (n === 14) return '중2';
  if (n === 15) return '중3';
  if (n === 16) return '고1';
  if (n === 17) return '고2';
  if (n === 18) return '고3';
  if (n >= 20 && n <= 29) return '20대';
  if (n >= 30 && n <= 39) return '30대';
  if (n >= 40 && n <= 49) return '40대';
  if (n >= 50) return '50대 이상';


  // 25세 이상은 그냥 숫자 리턴
  if (n >= 25) return `${n}세`;

  // 그 외(예: 12 이하)는 기타 처리
  return '기타';
}


// ── 따봉(👍/👎) → 점수/등급 계산 (라플라스 평활)
function calcTrust(up = 0, down = 0) {
  const total = up + down;
  const score = Math.round(((up + 1) / (total + 2)) * 100); // 0~100
  let grade = '데이터부족';
  if (total >= 3) {
    if (score >= 80) grade = '매우높음';
    else if (score >= 60) grade = '높음';
    else if (score >= 40) grade = '보통';
    else if (score >= 20) grade = '낮음';
    else grade = '매우낮음';
  }
  return { score, grade, total };
}


// GET /users/:userId
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  // 1) ID 포맷 검사
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: '잘못된 사용자 ID입니다.' });
  }

  try {
    console.log('▶ GET /users/:userId 호출, userId =', userId);
    const user = await User.findById(userId)
      .select('nickname bio profileImage trustScore trustScoreCount likesCount dislikesCount ageGroup');

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 신뢰도 파생값 계산
    const up = user.likesCount ?? 0;
    const down = user.dislikesCount ?? 0;
    const { score, grade, total } = calcTrust(up, down);

    return res.json({
      userId: user._id,
      nickname: user.nickname,
      bio: user.bio,
      profileImage: user.profileImage,
      ageGroup: user.ageGroup ?? '기타',
      trust: {
        grade,                 // 매우높음/높음/보통/낮음/매우낮음/데이터부족
        score,                 // 0~100
        total,                 // 평가 횟수
        likes: up,             // 👍
        dislikes: down         // 👎
      },
      // 하위호환(원래 필드도 유지하고 싶으면 남겨둠)
      trustScore: score,
      trustScoreCount: total,
    });
  } catch (err) {
    console.error('GET /users/:userId error', err);
    return res.status(500).json({ error: '서버 오류 - 프로필 조회 실패' });
  }
});

// GET /users/:userId/applications
router.get('/:userId/applications', async (req, res) => {
  try {
    const { userId } = req.params;
    const apps = await Application
      .find({ 'applicant.userId': userId, status: 'accepted' })
      .populate({
        path: 'post',
        populate: { path: 'writer', select: 'userId nickname profileImage' }
      });
    // null인 post를 제거
    const posts = apps
      .map(a => a.post)
      .filter(p => p != null);
    return res.json(posts);
  } catch (err) {
    console.error('참가 모임 조회 오류', err);
    return res.status(500).json({ error: '참가 모임을 불러올 수 없습니다.' });
  }
});


// 2) 사용자 정보 수정
// PATCH /users/:userId
// routes/users.js 에서 PATCH 핸들러 바로 위
router.patch('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { newNickname, nickname, bio, age, ageGroup, profileImage } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 닉네임 변경 제한 (최대 3회)
    const nextNickname = (typeof newNickname === 'string') ? newNickname
      : (typeof nickname === 'string' ? nickname : undefined);
    if (typeof nextNickname === 'string' && nextNickname !== user.nickname) {
      if (user.nicknameChangeCount >= 3) {
        return res.status(400).json({ error: '닉네임은 최대 3회까지 변경 가능합니다.' });
      }
      user.nickname = nextNickname;
      user.nicknameChangeCount += 1;

      await Post.updateMany(
        { writer: user._id },
        { $set: { writerNickname: nextNickname, writerProfileImage: profileImage } }
      );
      await Comment.updateMany(
        { author: user._id },                                // ← ObjectId 참조 필드로 필터
        {
          $set: {
            nickname: nextNickname,                           // ← 새로 추가한 nickname
            profileImage: profileImage                       // ← 새로 추가한 profileImage
          }
        }
      );
    }


    // 3) 과거 게시글·댓글 동기화

    if (bio !== undefined) user.bio = bio;
    // 나이/나이그룹 처리
    if (ageGroup !== undefined) {
      user.ageGroup = normalizeAgeGroup(ageGroup);
    } else if (age !== undefined) {
      const g = toAgeGroup(age);
      if (g) user.ageGroup = normalizeAgeGroup(g);
    }
    if (profileImage !== undefined) user.profileImage = profileImage; // ✅ 추가된 부분

    await user.save();
    return res.json({ user });  // 수정 후 응답

  } catch (err) {
    console.error('PATCH /users/:userId error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /users/:userId/stats  → 내가 만든/참가한 모임 수
router.get('/:userId/stats', async (req, res) => {
  const { userId } = req.params;

  // Post의 작성자 필드가 'writer'인 건 위에서 updateMany에 쓰인 걸로 확인됨
  const created = await Post.countDocuments({ writer: userId });

  // ChatRoom.participants.userId 로 참가 검색 (캐스팅됨)
  const joined = await ChatRoom.countDocuments({ 'participants.userId': userId });

  return res.json({ created, joined });
});

module.exports = router;