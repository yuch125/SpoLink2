require('dotenv').config({ path: '../.env' });
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();
const jwt = require('jsonwebtoken');
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>SpoLink API 안내</title>
      </head>
      <body style="font-family: sans-serif; padding: 2rem; background: #f4f4f4;">
        <h2>✅ SpoLink 서버에 오신 걸 환영합니다!</h2>
        <p>🔗 사용 가능한 API 목록:</p>
        <ul>
          <li><a href="/users" target="_blank">[GET] /users - 전체 사용자 확인</a></li>
          <li><a href="/signup" onclick="alert('이 API는 POST 전용입니다. Thunder Client 또는 앱에서 테스트하세요.'); return false;">[POST] /signup - 회원가입</a></li>
          <li><a href="/login" onclick="alert('이 API는 POST 전용입니다. Thunder Client 또는 앱에서 테스트하세요.'); return false;">[POST] /login - 로그인</a></li>
          <li><a href="/status" target="_blank">[GET] /status - 서버 상태 확인</a></li>
        </ul>
        <p style="margin-top: 2rem;">📱 이 서버 주소를 앱의 SERVER_URL에 입력하세요.<br/>
        예: <code>http://192.168.68.55:3000</code></p>
      </body>
    </html>
  `);
});

app.post('/login', async (req, res) => {
  console.log('🔥 로그인 요청 도착:', req.body);
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log('❗ 사용자 없음');
      return res.json({ success: false, message: '존재하지 않는 사용자입니다.' });
    }

    console.log('🔑 사용자 찾음:', user);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ 비밀번호 불일치');
      return res.json({ success: false, message: '비밀번호가 틀렸어요.' });
    }

    console.log('✅ 비밀번호 일치, 토큰 발급 중');

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ 로그인 성공, 응답 전송');
    return res.json({ success: true, message: '로그인 성공', userId: user._id });
  } catch (err) {
    console.log('🚨 로그인 서버 오류:', err.message);
    return res.status(500).json({ success: false, message: '서버 에러', error: err.message });
  }
});

// 미들웨어: JSON 파싱
app.use(express.json()); 

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB 연결 성공!');
}).catch((err) => {
  console.error('MongoDB 연결 실패:', err);
});

// 사용자 스키마 정의
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

// 모델 선언
const User = mongoose.model('User', userSchema);

// API 엔드포인트: 회원가입
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existUser = await User.findOne({ username });
    if (existUser) {
      return res.json({ success: false, message: '이미 존재하는 사용자입니다.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // 🔐 암호화
    await User.create({ username, password: hashedPassword });

    res.json({ success: true, message: '회원가입 성공' });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 에러', error: err.message });
  }
});

// API 엔드포인트: 로그인
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('🔥 로그인 요청 도착:', req.body);
  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log('❌ 사용자 없음:', username);
      return res.json({ success: false, message: '존재하지 않는 사용자입니다.' });
    }

    const isMatch = await bcrypt.compare(password, user.password); // 🔐 비교
    if (!isMatch) {
      console.log('❌ 비밀번호 불일치:', username);
      return res.json({ success: false, message: '비밀번호가 틀렸어요.' });
    }

    console.log('✅ 로그인 성공!', username);

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ success: true, message: '로그인 성공', userId: user._id });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 에러', error: err.message });
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 시작됨`);
});
