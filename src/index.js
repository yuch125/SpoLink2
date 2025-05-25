require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

const PORT = process.env.PORT || 3000;

// 몽고DB 모델 정의
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
const User = mongoose.model('User', userSchema);

// 서버 시작 전에 테스트 사용자 생성 함수
const createTestUser = async () => {
  const existingUser = await User.findOne({ username: 'testuser' });
  if (!existingUser) {
    await User.create({ username: 'testuser', password: 'mypassword' });
    console.log('테스트 사용자 생성 완료');
  }
};

// 몽고DB 연결
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('몽고DB 연결 성공!');
  await createTestUser();

  // 서버 시작
  app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 시작됨`);
    console.log(`접속 링크: http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('몽고DB 연결 실패:', err);
});

// 기본 API
app.get('/', (req, res) => {
  res.send('서버 잘 띄웠어요!');
});

// 데이터 GET API
app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from server!', data: [1, 2, 3] });
});

// JSON 파서 미들웨어
app.use(express.json()); 

// 데이터 POST API
app.post('/api/data', (req, res) => {
  const receivedData = req.body;
  console.log(receivedData);
  res.json({ status: 'success', received: receivedData });
});

// 로그인 API
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: '존재하지 않는 사용자입니다.' });
    }
    if (user.password !== password) {
      return res.status(401).json({ message: '비밀번호가 틀렸어요.' });
    }
    // 로그인 성공
    res.json({ message: '로그인 성공!', userId: user._id });
  } catch (err) {
    res.status(500).json({ message: '서버 에러', error: err });
  }
});
