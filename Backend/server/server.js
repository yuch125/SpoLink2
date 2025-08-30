// server.js
console.log('✅ server.js 진입 시작: 파일 정상 실행');

// ─────────────────────────────────────────────
// 📦 0. 의존성 및 환경 설정
// ─────────────────────────────────────────────
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const http = require('http')
const socketIo = require('socket.io');
require('dotenv').config({ path: __dirname + '/../.env' });
const app = express();
const server = http.createServer(app)
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] }
});
app.set('io', io);


// ✅ 메시지 DB 모델 import
const Message = require('../models/Message');
const Post = require("../models/Post")
const roomMembers = new Map(); // 중복 카운트 방지

// ✅ Socket.IO 설정
io.on('connection', (socket) => {
  console.log('✅ 새 클라이언트 연결:', socket.id);

  socket.on('register', ({ userId }) => {
    if (!userId) return;
    const room = `user:${userId}`;
    socket.join(room);
    console.log(`👤 User ${userId} registered to room ${room}`);
  });
  



  socket.on('joinRoom', ({ roomId, userId }) => {
    socket.join(roomId);
    console.log(`👥 ${userId}가 방(${roomId})에 입장함`);
  });

  socket.on('sendMessage', async ({ roomId, senderId, content }) => {
    try {
      // create()가 이미 저장까지 해 줌
      const saved = await Message.create({ roomId, sender: senderId, content });
      const populated = await saved.populate('sender', 'nickname profileImage');
      io.to(roomId.toString()).emit('newMessage', populated);
    } catch (err) {
      console.error('❌ sendMessage 처리 중 오류:', err);
    }
  });

  socket.on('readMessage', async ({ roomId, messageId, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;
  
      // ObjectId → String 변환 후 비교
      const readByStrings = message.readBy.map(id => id.toString());
      if (!readByStrings.includes(userId)) {
        message.readBy.push(userId); // 그대로 ObjectId or string 상관없음
        await message.save();
  
        io.to(roomId).emit('messageRead', { messageId, readerId: userId });
      } else {
        console.log('📛 이미 읽은 메시지라 emit 안 함');
      }
    } catch (err) {
      console.error('❌ 메시지 읽음 처리 오류:', err);
    }
  });
  
  
  

  // — 메시지 삭제
  socket.on('deleteMessage', async ({ roomId, messageId, userId }) => {
    try {
      const msg = await Message.findById(messageId);

      console.log('✅ msg:', msg);
      console.log('✅ msg.constructor.name:', msg?.constructor?.name);
      console.log('✅ typeof msg.remove:', typeof msg?.remove);
      

      if (!msg) {
        console.warn('❌ 메시지를 찾을 수 없음:', messageId);
        return;
      }

      if (String(msg.sender) !== userId) {
        console.warn('❌ 삭제 권한 없음:', userId);
        return;
      }

      await msg.deleteOne(); // 여기가 문제 터지는 부분
      io.to(roomId.toString()).emit('messageDeleted', messageId);
    } catch (err) {
      console.error('❌ deleteMessage 처리 중 오류:', err);
    }
  });


  socket.on('disconnect', () => {
    console.log('❌ 클라이언트 연결 종료:', socket.id);
  });

  // - 평가 요청 메시지
  socket.on('endMeeting', ({ roomId }) => {
    io.to(roomId).emit('trustRequest', {
      message: '모임이 종료되었습니다! 참가자들을 평가해주세요.',
    });
  });

});



module.exports = { app, server };

const PORT = process.env.PORT || 3000;

// 디버깅 로그
console.log('✨ (디버깅) __dirname =', __dirname);
console.log('✨ (디버깅) process.cwd() =', process.cwd());
console.log('✨ (디버깅) MONGODB_URI =', process.env.MONGODB_URI);

// ─────────────────────────────────────────────
// 🛠️ 1. 미들웨어 설정
// ─────────────────────────────────────────────
app.use(express.json());

// ─────────────────────────────────────────────
// 👤 2. 사용자 모델 & 라우터 불러오기
// ─────────────────────────────────────────────
const User = require('../models/User');
const applicationRoutes = require('../routes/applications');
const usersRouter = require('../routes/users');
const commentRoutes = require('../routes/comments');
const postsRouter = require('../routes/posts');
const messageRoutes = require('../routes/messages');
const chatRoomRoutes = require('../routes/chatrooms');
const uploadRoutes = require('../routes/upload');
const trustRouter = require('../routes/trust')
const TrustEvaluation = require('../models/TrustEvaluation')
const Evaluation = require('../models/Evaluation')
// ─────────────────────────────────────────────
// 🔗 3. 라우터 등록
// ─────────────────────────────────────────────
// server.js 상단, 다른 app.use 보다 위에
app.use((req, res, next) => {
  console.log(`📥 Incoming → [${req.method}] ${req.url}`);
  next();
});
applicationRoutes.setIo(io);
app.use('/evaluations', require('../routes/evaluations'));
app.use('/applications', applicationRoutes);
app.use('/users', usersRouter);
app.use('/comments', commentRoutes);
app.use('/posts', postsRouter);
app.use('/messages', messageRoutes)
app.use('/chatrooms', chatRoomRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/upload', require('../routes/upload'));
app.use('/trust', trustRouter);

// ─────────────────────────────────────────────
// 🔧 4. 유틸성 API
// ─────────────────────────────────────────────

// [GET] /status - 서버 상태 확인
app.get('/status', (req, res) => {
  res.json({ success: true, message: '서버 정상 작동 중' });
});

// [GET] /users - 전체 사용자 조회
app.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: '서버 에러', error: err.message });
  }
});

// ─────────────────────────────────────────────
// 🔐 5. 회원가입 & 로그인 API
// ─────────────────────────────────────────────

// [POST] /signup - 회원가입
app.post('/signup', async (req, res) => {
  const { username, password, nickname, profileImage, bio, ageGroup } = req.body;

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
      ageGroup: ageGroup || null,   // ✅ 저장
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
      profileImage: user.profileImage || '',
      ageGroup: user.ageGroup || null,   // ✅ 추가
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
// 🔌 6. MongoDB 연결 및 서버 실행
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

    // [🧹 자동 삭제 기능] 마감된 모집 카드 제거
    const Post = require('../models/Post')
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
    }, 10 * 60 * 100000); // 10분마다 실행 (← 단위 조정 필요 가능성 있음)

    // [🚀 서버 시작]
    server.listen(PORT, () => {
      console.log(`🚀 서버가 포트 ${PORT}에서 실행됨`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB 연결 실패:', err);
  });