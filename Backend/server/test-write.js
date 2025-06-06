// test-write.js

// 1) 스크립트 실행 여부 확인용 로그
console.log('▶▶▶ test-write.js 스크립트 시작');

// 2) .env 파일 로드
//    이 파일(test-write.js)와 같은 폴더에 .env가 없고, 
//    상위 폴더(Backend)에 .env가 있을 경우 아래와 같이 경로를 조정해야 합니다.
require('dotenv').config({ path: __dirname + '/../.env' });

// 3) 환경변수 확인용 로그
console.log('▶▶▶ Loaded MONGO_URI =', process.env.MONGODB_URI);

const mongoose = require('mongoose');

// 4) 간단한 스키마 정의(컬렉션 이름: testWrite)
const TestSchema = new mongoose.Schema(
  { title: String },
  { collection: 'testWrite' }
);
const TestModel = mongoose.model('TestWrite', TestSchema);

// 5) Atlas 연결
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('✅ Atlas 연결 성공 (테스트 스크립트)');
    // 디버그 모드 켜기 (어떤 쿼리를 보내는지 로그로 확인 가능)
    mongoose.set('debug', true);

    try {
      // 6) 문서 하나 삽입
      const doc = await TestModel.create({ title: 'hello-atlas' });
      console.log('✅ 테스트 문서 저장 성공:', doc);
    } catch (err) {
      console.error('❌ 테스트 저장 실패:', err);
    } finally {
      await mongoose.disconnect();
      console.log('▶▶▶ Mongoose 연결 해제 완료, 스크립트 종료');
    }
  })
  .catch(err => {
    console.error('❌ Atlas 연결 실패 (테스트 스크립트):', err);
  });
