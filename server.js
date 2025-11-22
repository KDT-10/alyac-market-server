const express = require("express");
const jsonServer = require("json-server");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const PORT = 3000;

// ============================================
// JWT 설정
// ============================================
const JWT_CONFIG = {
  ACCESS_TOKEN_SECRET:
    process.env.ACCESS_TOKEN_SECRET || "your-access-token-secret-key",
  REFRESH_TOKEN_SECRET:
    process.env.REFRESH_TOKEN_SECRET || "your-refresh-token-secret-key",
  ACCESS_TOKEN_EXPIRES_IN: "1h", // 1시간
  REFRESH_TOKEN_EXPIRES_IN: "1d", // 1일
};

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

// JWT 토큰 생성 함수
function generateToken(user, tokenType = "access") {
  const isAccessToken = tokenType === "access";

  const payload = isAccessToken
    ? {
        _id: user._id,
        email: user.email,
        accountname: user.accountname,
      }
    : {
        _id: user._id,
        email: user.email,
      };

  const secret = isAccessToken
    ? JWT_CONFIG.ACCESS_TOKEN_SECRET
    : JWT_CONFIG.REFRESH_TOKEN_SECRET;

  const expiresIn = isAccessToken
    ? JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN
    : JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN;

  return jwt.sign(payload, secret, { expiresIn });
}

// JWT 토큰 검증 함수
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
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

/**
 * POST /api/user/signin - 로그인 API
 *
 * Request Body:
 * {
 *   "user": {
 *     "email": String (required),
 *     "password": String (required)
 *   }
 * }
 */
apiRouter.post("/user/signin", (req, res) => {
  try {
    const { user } = req.body;

    // 1. 입력값 검증
    const hasEmail = user && user.email;
    const hasPassword = user && user.password;

    // email과 password 둘 다 없을 때
    if (!hasEmail && !hasPassword) {
      return res.status(400).json({
        message: "이메일 또는 비밀번호를 입력해주세요.",
      });
    }

    // email만 없을 때
    if (!hasEmail) {
      return res.status(400).json({
        message: "이메일을 입력해주세요.",
      });
    }

    // password만 없을 때
    if (!hasPassword) {
      return res.status(400).json({
        message: "비밀번호를 입력해주세요.",
      });
    }

    // json-server의 lowdb 인스턴스를 통한 DB 접근
    const db = router.db;

    // 2. 이메일로 사용자 찾기
    const foundUser = db.get("users").find({ email: user.email }).value();

    // 3. 사용자가 없거나 비밀번호가 일치하지 않을 때
    if (!foundUser || foundUser.password !== user.password) {
      return res.status(422).json({
        message: "이메일 또는 비밀번호가 일치하지 않습니다.",
        status: 422,
      });
    }

    // 4. 로그인 성공 - JWT 토큰 생성
    const accessToken = generateToken(foundUser, "access");
    const refreshToken = generateToken(foundUser, "refresh");

    // 5. 성공 응답 (password 제외, accessToken과 refreshToken 포함)
    res.status(200).json({
      user: {
        _id: foundUser._id,
        username: foundUser.username,
        email: foundUser.email,
        accountname: foundUser.accountname,
        image: foundUser.image,
        accessToken: accessToken,
        refreshToken: refreshToken,
      },
    });
  } catch (error) {
    console.error("로그인 오류:", error);
    res.status(500).json({
      message: "서버 오류가 발생했습니다.",
    });
  }
});

/**
 * GET /api/user/myinfo - 내 정보 조회 API
 *
 * Headers:
 * {
 *   "Authorization": "Bearer {accessToken}"
 * }
 */
apiRouter.get("/user/myinfo", (req, res) => {
  try {
    // 1. Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "인증 토큰이 필요합니다.",
      });
    }

    const token = authHeader.substring(7); // "Bearer " 제거

    // 2. 토큰 검증
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        message: "유효하지 않은 토큰입니다.",
      });
    }

    // 3. DB에서 사용자 정보 조회
    const db = router.db;
    const user = db.get("users").find({ _id: decoded._id }).value();

    if (!user) {
      return res.status(404).json({
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    // 4. following, follower 정보 가져오기
    const following = user.following || [];
    const follower = user.follower || [];

    // 5. 성공 응답
    res.status(200).json({
      user: {
        _id: user._id,
        username: user.username,
        accountname: user.accountname,
        image: user.image,
        isfollow: false, // 자기 자신이므로 항상 false
        following: following,
        follower: follower,
        followerCount: follower.length,
        followingCount: following.length,
      },
    });
  } catch (error) {
    console.error("내 정보 조회 오류:", error);
    res.status(500).json({
      message: "서버 오류가 발생했습니다.",
    });
  }
});

// ============================================
// json-server 라우터 (REST API 자동 생성)
// ============================================
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
});
