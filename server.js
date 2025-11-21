const express = require("express");
const jsonServer = require("json-server");
const path = require("path");

const app = express();
const PORT = 3000;

// ============================================
// json-server 설정
// ============================================
const dbPath = path.join(__dirname, "db.json");
const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults();

// ============================================
// 유틸리티 함수
// ============================================

// 이메일 형식 검증
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// accountname 형식 검증 (영문, 숫자, 밑줄, 마침표만)
function isValidAccountname(accountname) {
  const accountnameRegex = /^[a-zA-Z0-9_.]+$/;
  return accountnameRegex.test(accountname);
}

// 고유 ID 생성
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// ============================================
// 미들웨어 설정
// ============================================
app.use(middlewares); // json-server 기본 미들웨어 (CORS, static, logger 등)
app.use(express.json()); // JSON 파싱

// ============================================
// API 라우터 설정
// ============================================
const apiRouter = express.Router();

// ============================================
// 커스텀 라우트 (json-server 라우터보다 먼저 정의)
// ============================================

/**
 * POST /api/user - 회원가입 API
 *
 * Request Body:
 * {
 *   "user": {
 *     "username": String (required),
 *     "email": String (required),
 *     "password": String (required, min 6 chars),
 *     "accountname": String (required, alphanumeric + _ . only),
 *     "intro": String (optional),
 *     "image": String (optional)
 *   }
 * }
 */
apiRouter.post("/user", (req, res) => {
  try {
    const { user } = req.body;

    // 1. 필수 입력사항 체크
    if (
      !user ||
      !user.username ||
      !user.email ||
      !user.password ||
      !user.accountname
    ) {
      return res.status(400).json({
        message: "필수 입력사항을 입력해주세요.",
      });
    }

    // 2. 비밀번호 길이 체크
    if (user.password.length < 6) {
      return res.status(400).json({
        message: "비밀번호는 6자 이상이어야 합니다.",
      });
    }

    // 3. 이메일 형식 체크
    if (!isValidEmail(user.email)) {
      return res.status(400).json({
        message: "잘못된 이메일 형식입니다.",
      });
    }

    // 4. accountname 형식 체크
    if (!isValidAccountname(user.accountname)) {
      return res.status(400).json({
        message: "영문, 숫자, 밑줄, 마침표만 사용할 수 있습니다.",
      });
    }

    // json-server의 lowdb 인스턴스를 통한 DB 접근
    const db = router.db; // json-server의 db 인스턴스 사용

    // 5. 이메일 중복 체크
    const existingEmail = db.get("users").find({ email: user.email }).value();
    if (existingEmail) {
      return res.status(400).json({
        message: "이미 가입된 이메일 주소입니다.",
      });
    }

    // 6. accountname 중복 체크
    const existingAccountname = db
      .get("users")
      .find({ accountname: user.accountname })
      .value();
    if (existingAccountname) {
      return res.status(400).json({
        message: "이미 사용중인 계정 ID입니다.",
      });
    }

    // 새 사용자 생성
    const newUser = {
      _id: generateId(),
      username: user.username,
      email: user.email,
      accountname: user.accountname,
      intro: user.intro || "",
      image: user.image || "",
      password: user.password, // 실제 프로덕션에서는 bcrypt 등으로 해시화 필요
    };

    // DB에 사용자 추가 (json-server의 lowdb 체인 사용)
    db.get("users").push(newUser).write();

    // 성공 응답 (password 제외)
    const { password, ...userResponse } = newUser;
    res.status(201).json({
      message: "회원가입 성공",
      user: userResponse,
    });
  } catch (error) {
    console.error("회원가입 오류:", error);
    res.status(500).json({
      message: "서버 오류가 발생했습니다.",
    });
  }
});

apiRouter.get("/user", (req, res) => {
  return res.status(200).json({
    message: "회원가입 성공",
  });
});

// ============================================
// json-server 라우터 (REST API 자동 생성)
// ============================================
// GET    /api/users       - 모든 사용자 조회
// GET    /api/users/:id   - 특정 사용자 조회
// POST   /api/users       - 사용자 생성 (json-server 기본)
// PUT    /api/users/:id   - 사용자 수정
// PATCH  /api/users/:id   - 사용자 부분 수정
// DELETE /api/users/:id   - 사용자 삭제
apiRouter.use(router);

// ============================================
// API 라우터를 /api prefix로 마운트
// ============================================
app.use("/api", apiRouter);

// ============================================
// 서버 시작
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 Available API endpoints:`);
  console.log(`   POST   http://localhost:${PORT}/api/user (Custom signup)`);
  console.log(`   GET    http://localhost:${PORT}/api/users`);
  console.log(`   GET    http://localhost:${PORT}/api/users/:id`);
  console.log(`   POST   http://localhost:${PORT}/api/users`);
  console.log(`   PUT    http://localhost:${PORT}/api/users/:id`);
  console.log(`   PATCH  http://localhost:${PORT}/api/users/:id`);
  console.log(`   DELETE http://localhost:${PORT}/api/users/:id`);
});
