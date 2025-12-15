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

/**
 * POST /api/user/emailvalid - 이메일 중복 확인 API
 *
 * Request Body:
 * {
 *   "user": {
 *     "email": String (required)
 *   }
 * }
 */
apiRouter.post("/user/emailvalid", (req, res) => {
  try {
    const { user } = req.body;

    // 1. 이메일 입력 확인
    if (!user || !user.email) {
      return res.status(400).json({
        message: "잘못된 접근입니다.",
      });
    }

    // 2. 이메일 형식 검증
    if (!isValidEmail(user.email)) {
      return res.status(400).json({
        message: "잘못된 접근입니다.",
      });
    }

    // 3. DB에서 이메일 중복 확인
    const db = router.db;
    const existingEmail = db.get("users").find({ email: user.email }).value();

    // 4. 이메일 중복 여부에 따른 응답
    if (existingEmail) {
      return res.status(200).json({
        message: "이미 가입된 이메일 주소 입니다.",
      });
    }

    // 5. 사용 가능한 이메일
    res.status(200).json({
      message: "사용 가능한 이메일 입니다.",
    });
  } catch (error) {
    console.error("이메일 확인 오류:", error);
    res.status(500).json({
      message: "서버 오류가 발생했습니다.",
    });
  }
});

/**
 * POST /api/user/accountnamevalid - 계정ID 중복 확인 API
 *
 * Request Body:
 * {
 *   "user": {
 *     "accountname": String (required)
 *   }
 * }
 */
apiRouter.post("/user/accountnamevalid", (req, res) => {
  try {
    const { user } = req.body;

    // 1. accountname 입력 확인
    if (!user || !user.accountname) {
      return res.status(400).json({
        message: "잘못된 접근입니다.",
      });
    }

    // 2. accountname 형식 검증
    if (!isValidAccountname(user.accountname)) {
      return res.status(400).json({
        message: "잘못된 접근입니다.",
      });
    }

    // 3. DB에서 accountname 중복 확인
    const db = router.db;
    const existingAccountname = db
      .get("users")
      .find({ accountname: user.accountname })
      .value();

    // 4. accountname 중복 여부에 따른 응답
    if (existingAccountname) {
      return res.status(200).json({
        message: "이미 가입된 계정ID 입니다.",
      });
    }

    // 5. 사용 가능한 계정ID
    res.status(200).json({
      message: "사용 가능한 계정ID 입니다.",
    });
  } catch (error) {
    console.error("계정ID 확인 오류:", error);
    res.status(500).json({
      message: "서버 오류가 발생했습니다.",
    });
  }
});

/**
 * PUT /api/user - 사용자 정보 수정 API
 *
 * Headers:
 * {
 *   "Authorization": "Bearer {accessToken}"
 * }
 *
 * Request Body:
 * {
 *   "user": {
 *     "username": String,
 *     "accountname": String,
 *     "intro": String,
 *     "image": String
 *   }
 * }
 */
apiRouter.put("/user", (req, res) => {
  try {
    // 1. Authorization 헤더에서 토큰 추출 및 검증
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "인증 토큰이 필요합니다.",
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        message: "유효하지 않은 토큰입니다.",
      });
    }

    // 2. Request Body 검증
    const { user } = req.body;

    if (!user) {
      return res.status(400).json({
        message: "잘못된 요청입니다.",
      });
    }

    // 3. DB에서 현재 사용자 정보 조회
    const db = router.db;
    const currentUser = db.get("users").find({ _id: decoded._id }).value();

    if (!currentUser) {
      return res.status(404).json({
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    // 4. accountname이 변경되는 경우 중복 확인
    if (user.accountname && user.accountname !== currentUser.accountname) {
      // accountname 형식 검증
      if (!isValidAccountname(user.accountname)) {
        return res.status(400).json({
          message: "영문, 숫자, 밑줄, 마침표만 사용할 수 있습니다.",
        });
      }

      // 다른 사용자가 이미 사용중인지 확인
      const existingAccountname = db
        .get("users")
        .find({ accountname: user.accountname })
        .value();

      if (existingAccountname) {
        return res.status(400).json({
          message: "이미 사용중인 계정 ID입니다.",
        });
      }
    }

    // 5. 사용자 정보 업데이트
    const updatedUserData = {
      ...currentUser,
      username:
        user.username !== undefined ? user.username : currentUser.username,
      accountname:
        user.accountname !== undefined
          ? user.accountname
          : currentUser.accountname,
      intro: user.intro !== undefined ? user.intro : currentUser.intro,
      image: user.image !== undefined ? user.image : currentUser.image,
    };

    // 6. DB 업데이트
    db.get("users").find({ _id: decoded._id }).assign(updatedUserData).write();

    // 7. following, follower 정보 가져오기
    const following = updatedUserData.following || [];
    const follower = updatedUserData.follower || [];

    // 8. 성공 응답
    res.status(200).json({
      user: {
        _id: updatedUserData._id,
        username: updatedUserData.username,
        accountname: updatedUserData.accountname,
        intro: updatedUserData.intro,
        image: updatedUserData.image,
        following: following,
        follower: follower,
        followerCount: follower.length,
        followingCount: following.length,
      },
    });
  } catch (error) {
    console.error("사용자 정보 수정 오류:", error);
    res.status(500).json({
      message: "서버 오류가 발생했습니다.",
    });
  }
});

/**
 * GET /api/profile/:accountname - 사용자 프로필 조회 API
 *
 * Headers (Optional):
 * {
 *   "Authorization": "Bearer {accessToken}"
 * }
 *
 * URL Parameters:
 * - accountname: 조회할 사용자의 계정ID
 */
apiRouter.get("/profile/:accountname", (req, res) => {
  try {
    const { accountname } = req.params;

    // 1. DB에서 accountname으로 사용자 찾기
    const db = router.db;
    const targetUser = db
      .get("users")
      .find({ accountname: accountname })
      .value();

    // 2. 사용자가 존재하지 않을 때
    if (!targetUser) {
      return res.status(404).json({
        message: "해당 계정이 존재하지 않습니다.",
      });
    }

    // 3. isfollow 확인을 위한 현재 로그인 사용자 확인 (선택적)
    let isfollow = false;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (decoded) {
        // 현재 로그인한 사용자 정보 조회
        const currentUser = db.get("users").find({ _id: decoded._id }).value();

        if (currentUser && currentUser.following) {
          // 현재 사용자의 following 배열에 targetUser._id가 있는지 확인
          isfollow = currentUser.following.includes(targetUser._id);
        }
      }
    }

    // 4. following, follower 정보 가져오기
    const following = targetUser.following || [];
    const follower = targetUser.follower || [];

    // 5. 성공 응답
    res.status(200).json({
      profile: {
        _id: targetUser._id,
        username: targetUser.username,
        accountname: targetUser.accountname,
        intro: targetUser.intro,
        image: targetUser.image,
        isfollow: isfollow,
        following: following,
        follower: follower,
        followerCount: follower.length,
        followingCount: following.length,
      },
    });
  } catch (error) {
    console.error("프로필 조회 오류:", error);
    res.status(500).json({
      message: "서버 오류가 발생했습니다.",
    });
  }
});

/**
 * POST /api/profile/:accountname/follow - 사용자 팔로우 API
 *
 * Headers:
 * {
 *   "Authorization": "Bearer {accessToken}"
 * }
 *
 * URL Parameters:
 * - accountname: 팔로우할 사용자의 계정ID
 */
apiRouter.post("/profile/:accountname/follow", (req, res) => {
  try {
    // 1. Authorization 헤더에서 토큰 추출 및 검증
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "인증 토큰이 필요합니다.",
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        message: "유효하지 않은 토큰입니다.",
      });
    }

    const { accountname } = req.params;

    // 2. DB에서 팔로우 대상 사용자 찾기
    const db = router.db;
    const targetUser = db
      .get("users")
      .find({ accountname: accountname })
      .value();

    // 3. 대상 사용자가 존재하지 않을 때
    if (!targetUser) {
      return res.status(404).json({
        message: "해당 계정이 존재하지 않습니다.",
      });
    }

    // 4. 현재 로그인한 사용자 정보 조회
    const currentUser = db.get("users").find({ _id: decoded._id }).value();

    if (!currentUser) {
      return res.status(404).json({
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    // 5. 자기 자신을 팔로우하려고 할 때
    if (currentUser._id === targetUser._id) {
      return res.status(400).json({
        message: "자기 자신을 팔로우 할 수 없습니다.",
      });
    }

    // 6. following, follower 배열 초기화
    const currentUserFollowing = currentUser.following || [];
    const targetUserFollower = targetUser.follower || [];

    // 7. 이미 팔로우한 경우 중복 방지
    if (currentUserFollowing.includes(targetUser._id)) {
      // 이미 팔로우한 경우에도 성공 응답 반환
      const following = targetUser.following || [];
      const follower = targetUserFollower;

      return res.status(200).json({
        profile: {
          _id: targetUser._id,
          username: targetUser.username,
          accountname: targetUser.accountname,
          intro: targetUser.intro,
          image: targetUser.image,
          isfollow: true,
          following: following,
          follower: follower,
          followerCount: follower.length,
          followingCount: following.length,
        },
      });
    }

    // 8. 팔로우 추가
    currentUserFollowing.push(targetUser._id);
    targetUserFollower.push(currentUser._id);

    // 9. DB 업데이트 - 현재 사용자의 following 업데이트
    db.get("users")
      .find({ _id: currentUser._id })
      .assign({ following: currentUserFollowing })
      .write();

    // 10. DB 업데이트 - 대상 사용자의 follower 업데이트
    db.get("users")
      .find({ _id: targetUser._id })
      .assign({ follower: targetUserFollower })
      .write();

    // 11. 업데이트된 대상 사용자 정보 다시 조회
    const updatedTargetUser = db
      .get("users")
      .find({ _id: targetUser._id })
      .value();
    const following = updatedTargetUser.following || [];
    const follower = updatedTargetUser.follower || [];

    // 12. 성공 응답
    res.status(200).json({
      profile: {
        _id: updatedTargetUser._id,
        username: updatedTargetUser.username,
        accountname: updatedTargetUser.accountname,
        intro: updatedTargetUser.intro,
        image: updatedTargetUser.image,
        isfollow: true,
        following: following,
        follower: follower,
        followerCount: follower.length,
        followingCount: following.length,
      },
    });
  } catch (error) {
    console.error("팔로우 오류:", error);
    res.status(500).json({
      message: "서버 오류가 발생했습니다.",
    });
  }
});

/**
 * DELETE /api/profile/:accountname/unfollow - 사용자 언팔로우 API
 *
 * Headers:
 * {
 *   "Authorization": "Bearer {accessToken}"
 * }
 *
 * URL Parameters:
 * - accountname: 언팔로우할 사용자의 계정ID
 */
apiRouter.delete("/profile/:accountname/unfollow", (req, res) => {
  try {
    // 1. Authorization 헤더에서 토큰 추출 및 검증
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "인증 토큰이 필요합니다.",
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        message: "유효하지 않은 토큰입니다.",
      });
    }

    const { accountname } = req.params;

    // 2. DB에서 언팔로우 대상 사용자 찾기
    const db = router.db;
    const targetUser = db
      .get("users")
      .find({ accountname: accountname })
      .value();

    // 3. 대상 사용자가 존재하지 않을 때
    if (!targetUser) {
      return res.status(404).json({
        message: "해당 계정이 존재하지 않습니다.",
      });
    }

    // 4. 현재 로그인한 사용자 정보 조회
    const currentUser = db.get("users").find({ _id: decoded._id }).value();

    if (!currentUser) {
      return res.status(404).json({
        message: "사용자를 찾을 수 없습니다.",
      });
    }

    // 5. following, follower 배열 초기화
    const currentUserFollowing = currentUser.following || [];
    const targetUserFollower = targetUser.follower || [];

    // 6. 언팔로우 처리 - 배열에서 제거
    const updatedCurrentUserFollowing = currentUserFollowing.filter(
      (id) => id !== targetUser._id
    );
    const updatedTargetUserFollower = targetUserFollower.filter(
      (id) => id !== currentUser._id
    );

    // 7. DB 업데이트 - 현재 사용자의 following 업데이트
    db.get("users")
      .find({ _id: currentUser._id })
      .assign({ following: updatedCurrentUserFollowing })
      .write();

    // 8. DB 업데이트 - 대상 사용자의 follower 업데이트
    db.get("users")
      .find({ _id: targetUser._id })
      .assign({ follower: updatedTargetUserFollower })
      .write();

    // 9. 업데이트된 대상 사용자 정보 다시 조회
    const updatedTargetUser = db
      .get("users")
      .find({ _id: targetUser._id })
      .value();
    const following = updatedTargetUser.following || [];
    const follower = updatedTargetUser.follower || [];

    // 10. 성공 응답
    res.status(200).json({
      profile: {
        _id: updatedTargetUser._id,
        username: updatedTargetUser.username,
        accountname: updatedTargetUser.accountname,
        intro: updatedTargetUser.intro,
        image: updatedTargetUser.image,
        isfollow: false,
        following: following,
        follower: follower,
        followerCount: follower.length,
        followingCount: following.length,
      },
    });
  } catch (error) {
    console.error("언팔로우 오류:", error);
    res.status(500).json({
      message: "서버 오류가 발생했습니다.",
    });
  }
});

/**
 * GET /api/profile/:accountname/following - 팔로잉 목록 조회 API
 *
 * Headers (Optional):
 * {
 *   "Authorization": "Bearer {accessToken}"
 * }
 *
 * URL Parameters:
 * - accountname: 조회할 사용자의 계정ID
 *
 * Query Parameters:
 * - limit: 조회할 개수 (기본값: 10)
 * - skip: 건너뛸 개수 (기본값: 0)
 */
apiRouter.get("/profile/:accountname/following", (req, res) => {
  try {
    const { accountname } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;

    // 1. DB에서 accountname으로 사용자 찾기
    const db = router.db;
    const targetUser = db
      .get("users")
      .find({ accountname: accountname })
      .value();

    // 2. 사용자가 존재하지 않을 때
    if (!targetUser) {
      return res.status(404).json({
        message: "해당 계정이 존재하지 않습니다.",
      });
    }

    // 3. following 목록 가져오기
    const followingIds = targetUser.following || [];

    // 4. following이 없으면 빈 배열 반환
    if (followingIds.length === 0) {
      return res.status(200).json([]);
    }

    // 5. 현재 로그인한 사용자 확인 (선택적)
    let currentUser = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (decoded) {
        currentUser = db.get("users").find({ _id: decoded._id }).value();
      }
    }

    const currentUserFollowing = currentUser?.following || [];

    // 6. 페이지네이션 적용하여 following ID 슬라이스
    const paginatedFollowingIds = followingIds.slice(skip, skip + limit);

    // 7. 각 following ID에 해당하는 사용자 정보 조회
    const followingList = paginatedFollowingIds
      .map((followingId) => {
        const user = db.get("users").find({ _id: followingId }).value();

        if (!user) return null;

        // isfollow 확인
        const isfollow = currentUserFollowing.includes(user._id);
        const following = user.following || [];
        const follower = user.follower || [];

        return {
          _id: user._id,
          username: user.username,
          accountname: user.accountname,
          intro: user.intro,
          image: user.image,
          isfollow: isfollow,
          following: following,
          follower: follower,
          followerCount: follower.length,
          followingCount: following.length,
        };
      })
      .filter((user) => user !== null); // null 제거 (존재하지 않는 사용자)

    // 8. 성공 응답
    res.status(200).json(followingList);
  } catch (error) {
    console.error("팔로잉 목록 조회 오류:", error);
    res.status(500).json({
      message: "서버 오류가 발생했습니다.",
    });
  }
});

/**
 * GET /api/profile/:accountname/follower - 팔로워 목록 조회 API
 *
 * Headers (Optional):
 * {
 *   "Authorization": "Bearer {accessToken}"
 * }
 *
 * URL Parameters:
 * - accountname: 조회할 사용자의 계정ID
 *
 * Query Parameters:
 * - limit: 조회할 개수 (기본값: 10)
 * - skip: 건너뛸 개수 (기본값: 0)
 */
apiRouter.get("/profile/:accountname/follower", (req, res) => {
  try {
    const { accountname } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;

    // 1. DB에서 accountname으로 사용자 찾기
    const db = router.db;
    const targetUser = db
      .get("users")
      .find({ accountname: accountname })
      .value();

    // 2. 사용자가 존재하지 않을 때
    if (!targetUser) {
      return res.status(404).json({
        message: "해당 계정이 존재하지 않습니다.",
      });
    }

    // 3. follower 목록 가져오기
    const followerIds = targetUser.follower || [];

    // 4. follower가 없으면 빈 배열 반환
    if (followerIds.length === 0) {
      return res.status(200).json([]);
    }

    // 5. 현재 로그인한 사용자 확인 (선택적)
    let currentUser = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (decoded) {
        currentUser = db.get("users").find({ _id: decoded._id }).value();
      }
    }

    const currentUserFollowing = currentUser?.following || [];

    // 6. 페이지네이션 적용하여 follower ID 슬라이스
    const paginatedFollowerIds = followerIds.slice(skip, skip + limit);

    // 7. 각 follower ID에 해당하는 사용자 정보 조회
    const followerList = paginatedFollowerIds
      .map((followerId) => {
        const user = db.get("users").find({ _id: followerId }).value();

        if (!user) return null;

        // isfollow 확인
        const isfollow = currentUserFollowing.includes(user._id);
        const following = user.following || [];
        const follower = user.follower || [];

        return {
          _id: user._id,
          username: user.username,
          accountname: user.accountname,
          intro: user.intro,
          image: user.image,
          isfollow: isfollow,
          following: following,
          follower: follower,
          followerCount: follower.length,
          followingCount: following.length,
        };
      })
      .filter((user) => user !== null); // null 제거 (존재하지 않는 사용자)

    // 8. 성공 응답
    res.status(200).json(followerList);
  } catch (error) {
    console.error("팔로워 목록 조회 오류:", error);
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
