console.log('✅ server.js 진입 시작: 파일 정상 실행');

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '/../.env' });

const app = express();
const PORT = process.env.PORT || 3000;

console.log('✨ (디버깅) __dirname =', __dirname);
console.log('✨ (디버깅) process.cwd() =', process.cwd());
console.log('✨ (디버깅) MONGO_URI =', process.env.MONGODB_URI);

// ─────────────────────────────────────────────
// 1. 미들웨어 설정
// ─────────────────────────────────────────────
app.use(express.json());

// ─────────────────────────────────────────────
// 2. Mongoose 사용자 스키마 및 모델
// ─────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickname: { type: String },
  profileImage: { type: String },
  bio: { type: String },
});
const User = mongoose.model('User', userSchema);

// ─────────────────────────────────────────────
// 3. 사용자 API
// ─────────────────────────────────────────────

// [GET] /users - 전체 사용자 조회
app.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 에러', error: err.message });
  }
});

// [GET] /status - 서버 상태 확인
app.get('/status', (req, res) => {
  res.json({ success: true, message: '서버 정상 작동 중' });
});

// [POST] /signup - 회원가입
app.post('/signup', async (req, res) => {
  const { username, password, nickname, profileImage, bio } = req.body;

  try {
    const existUser = await User.findOne({ username });
    if (existUser) {
      return res.status(400).json({ success: false, message: '이미 존재하는 사용자입니다.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      password: hashedPassword,
      nickname: nickname || '',
      profileImage: profileImage || '',
      bio: bio || '',
    });

    res.json({ success: true, message: '회원가입 성공' });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 에러', error: err.message });
  }
});

// [POST] /login - 로그인
app.post('/login', async (req, res) => {
  console.log('🔥 로그인 요청:', req.body);
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log('❌ 사용자 없음:', username);
      return res.status(400).json({ success: false, message: '존재하지 않는 사용자입니다.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ 비밀번호 불일치:', username);
      return res.status(400).json({ success: false, message: '비밀번호가 틀렸어요.' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ 로그인 성공, 응답 전송');
    return res.json({
      success: true,
      message: '로그인 성공',
      token,
      userId: user._id,
      username: user.username,
      nickname: user.nickname || '',
    });
  } catch (err) {
    console.log('🚨 로그인 서버 오류:', err.message);
    return res.status(500).json({ success: false, message: '서버 에러', error: err.message });
  }
});

// [PUT] /users/:id - 프로필 수정
app.put('/users/:id', async (req, res) => {
  const { nickname, profileImage, bio } = req.body;

  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { nickname, profileImage, bio },
      { new: true }
    ).select('-password');

    res.json({ success: true, message: '프로필이 수정되었습니다.', user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: '수정 실패', error: err.message });
  }
});

// ─────────────────────────────────────────────
// 4. MongoDB 연결 및 서버 실행
// ─────────────────────────────────────────────
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose가 실제로 연결되었습니다!');
});
mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose 연결 에러 발생:', err);
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB 연결 성공!');

    // [라우터 등록] 모집 카드 기능
    const postsRouter = require('../routes/posts');
    app.use('/posts', postsRouter);

    // [자동 삭제 기능] 마감된 카드 제거
    const getPostModel = require('../models/Post');
    const Post = getPostModel(mongoose);
    setInterval(async () => {
      try {
        const now = new Date();
        const result = await Post.deleteMany({ expiresAt: { $lte: now } });
        if (result.deletedCount > 0) {
          console.log(`🧹 ${result.deletedCount}개 마감된 모집카드 삭제됨`);
        }
      } catch (err) {
        console.error('자동 삭제 에러:', err);
      }
    }, 10 * 60 * 1000);

    // [서버 시작]
    app.listen(PORT, () => {
      console.log(`🚀 서버가 포트 ${PORT}에서 실행됨`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB 연결 실패:', err);
  });