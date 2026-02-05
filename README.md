# Alyac Market Server

Alyac Market Server는 소셜 미디어 및 전자상거래 기능을 제공하는 REST API 서버입니다. JWT 기반 인증, 게시글 관리, 팔로우 시스템, 상품 관리 등의 기능을 포함합니다.

## 목차

- [시작하기](#시작하기)
- [환경 설정](#환경-설정)
- [API 문서](#api-문서)
- [주요 기능](#주요-기능)

---

## 시작하기

### 필수 요구사항

- Node.js (v14 이상 권장)
- npm 또는 yarn

### 설치

1. 저장소 클론 또는 프로젝트 다운로드

2. 의존성 설치

```bash
npm install
```

3. 서버 실행

```bash
npm start
```

서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

### 개발 모드

이 프로젝트는 nodemon을 사용하여 자동으로 서버를 재시작합니다.

```bash
npm start
```

### 디렉토리 구조

```
alyac-market-server/
├── db.json                 # JSON 데이터베이스 파일
├── server.js              # 메인 서버 파일
├── swagger.js             # Swagger API 문서 설정
├── uploadFiles/           # 업로드된 이미지 파일 저장소
└── package.json           # 프로젝트 의존성 및 스크립트
```

---

## 환경 설정

### JWT 토큰 설정

환경 변수로 JWT 시크릿 키를 설정할 수 있습니다. 설정하지 않으면 기본값이 사용됩니다.

```bash
export ACCESS_TOKEN_SECRET="your-access-token-secret-key"
export REFRESH_TOKEN_SECRET="your-refresh-token-secret-key"
```

- Access Token 만료: 1시간
- Refresh Token 만료: 1일

### 파일 업로드 설정

- 업로드 디렉토리: `uploadFiles/`
- 허용 파일 형식: jpeg, jpg, png, gif, webp
- 최대 파일 크기: 10MB
- 다중 업로드: 최대 10개 파일

---

## API 문서

### Swagger UI

API 문서는 Swagger UI를 통해 제공됩니다.

```
http://localhost:3000/api-docs
```

브라우저에서 위 URL에 접속하면 모든 API 엔드포인트를 확인하고 테스트할 수 있습니다.

---

## 주요 기능

### 1. 인증 (Authentication)

#### 회원가입

- **POST** `/api/user`
- Body:

```json
{
  "user": {
    "username": "홍길동",
    "email": "user@example.com",
    "password": "password123",
    "accountname": "user1234",
    "intro": "자기소개",
    "image": "uploadFiles/image.png"
  }
}
```

- Response:

```json
{
  "user": {
    "_id": "generated_id",
    "username": "홍길동",
    "email": "user@example.com",
    "accountname": "user1234",
    "intro": "자기소개",
    "image": "uploadFiles/image.png",
    "following": [],
    "follower": [],
    "token": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### 로그인

- **POST** `/api/user/signin`
- Body:

```json
{
  "user": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

#### Refresh Token으로 Access Token 재발급

- **POST** `/api/user/refresh`
- Body:

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

- Response:

```json
{
  "accessToken": "new_jwt_access_token",
  "refreshToken": "new_jwt_refresh_token"
}
```

이 API는 access token이 만료되었을 때 refresh token을 사용하여 새로운 access token을 받을 수 있습니다. Refresh token rotation 방식을 사용하여 새로운 refresh token도 함께 발급됩니다.

#### 이메일 중복 확인

- **POST** `/api/user/emailvalid`
- Body:

```json
{
  "user": {
    "email": "user@example.com"
  }
}
```

#### 계정ID 중복 확인

- **POST** `/api/user/accountnamevalid`
- Body:

```json
{
  "user": {
    "accountname": "user1234"
  }
}
```

### 2. 사용자 정보 (User)

#### 내 정보 조회

- **GET** `/api/user/myinfo`
- Headers: `Authorization: Bearer {token}`
- Response:

```json
{
  "user": {
    "_id": "user_id",
    "username": "홍길동",
    "email": "user@example.com",
    "accountname": "user1234",
    "intro": "자기소개",
    "image": "uploadFiles/image.png",
    "following": ["id1", "id2"],
    "follower": ["id3", "id4"],
    "followingCount": 2,
    "followerCount": 2
  }
}
```

#### 사용자 정보 수정

- **PUT** `/api/user`
- Headers: `Authorization: Bearer {token}`
- Body:

```json
{
  "user": {
    "username": "새이름",
    "accountname": "newaccount",
    "intro": "새 자기소개",
    "image": "uploadFiles/newimage.png"
  }
}
```

#### 토큰 검증

- **GET** `/api/user/checktoken`
- Headers: `Authorization: Bearer {token}`

#### 사용자 검색

- **GET** `/api/user/searchuser?keyword=검색어`
- Response:

```json
[
  {
    "_id": "user_id",
    "username": "홍길동",
    "accountname": "user1234",
    "image": "uploadFiles/image.png"
  }
]
```

### 3. 프로필 (Profile)

#### 프로필 조회

- **GET** `/api/profile/:accountname`
- Response:

```json
{
  "profile": {
    "_id": "user_id",
    "username": "홍길동",
    "accountname": "user1234",
    "intro": "자기소개",
    "image": "uploadFiles/image.png",
    "followingCount": 10,
    "followerCount": 20,
    "isfollow": false
  }
}
```

#### 팔로우

- **POST** `/api/profile/:accountname/follow`
- Headers: `Authorization: Bearer {token}`

#### 언팔로우

- **DELETE** `/api/profile/:accountname/unfollow`
- Headers: `Authorization: Bearer {token}`

#### 팔로잉 목록 조회

- **GET** `/api/profile/:accountname/following?limit=10&skip=0`

#### 팔로워 목록 조회

- **GET** `/api/profile/:accountname/follower?limit=10&skip=0`

### 4. 게시글 (Post)

#### 게시글 작성

- **POST** `/api/post`
- Headers: `Authorization: Bearer {token}`
- Body:

```json
{
  "post": {
    "content": "게시글 내용",
    "image": "uploadFiles/image1.png,uploadFiles/image2.png"
  }
}
```

#### 피드 조회 (팔로잉 게시글)

- **GET** `/api/post/feed?limit=10&skip=0`
- Headers: `Authorization: Bearer {token}`

#### 유저별 게시글 조회

- **GET** `/api/post/:accountname/userpost?limit=10&skip=0`

#### 게시글 상세 조회

- **GET** `/api/post/:post_id`

#### 게시글 수정

- **PUT** `/api/post/:post_id`
- Headers: `Authorization: Bearer {token}`
- Body:

```json
{
  "post": {
    "content": "수정된 내용",
    "image": "uploadFiles/newimage.png"
  }
}
```

#### 게시글 삭제

- **DELETE** `/api/post/:post_id`
- Headers: `Authorization: Bearer {token}`

#### 게시글 전체보기

- **GET** `/api/post?limit=10&skip=0`

#### 게시글 좋아요

- **POST** `/api/post/:post_id/heart`
- Headers: `Authorization: Bearer {token}`

#### 게시글 좋아요 취소

- **DELETE** `/api/post/:post_id/unheart`
- Headers: `Authorization: Bearer {token}`

#### 게시글 신고

- **POST** `/api/post/:post_id/report`
- Headers: `Authorization: Bearer {token}`

### 5. 댓글 (Comment)

#### 댓글 작성

- **POST** `/api/post/:post_id/comments`
- Headers: `Authorization: Bearer {token}`
- Body:

```json
{
  "comment": {
    "content": "댓글 내용"
  }
}
```

#### 댓글 리스트 조회

- **GET** `/api/post/:post_id/comments?limit=10&skip=0`

#### 댓글 삭제

- **DELETE** `/api/post/:post_id/comments/:comment_id`
- Headers: `Authorization: Bearer {token}`

#### 댓글 신고

- **POST** `/api/post/:post_id/comments/:comment_id/report`
- Headers: `Authorization: Bearer {token}`

### 6. 상품 (Product)

#### 상품 등록

- **POST** `/api/product`
- Headers: `Authorization: Bearer {token}`
- Body:

```json
{
  "product": {
    "itemName": "상품명",
    "price": 10000,
    "link": "http://example.com",
    "itemImage": "uploadFiles/product.png"
  }
}
```

#### 상품 리스트 조회

- **GET** `/api/product/:accountname`

#### 상품 상세 조회

- **GET** `/api/product/detail/:product_id`

#### 상품 수정

- **PUT** `/api/product/:product_id`
- Headers: `Authorization: Bearer {token}`
- Body:

```json
{
  "product": {
    "itemName": "수정된 상품명",
    "price": 20000,
    "link": "http://newlink.com",
    "itemImage": "uploadFiles/newproduct.png"
  }
}
```

#### 상품 삭제

- **DELETE** `/api/product/:product_id`
- Headers: `Authorization: Bearer {token}`

### 7. 이미지 업로드 (Image Upload)

#### 단일 이미지 업로드

- **POST** `/api/image/uploadfile`
- Content-Type: `multipart/form-data`
- Form Data: `image` (파일)
- Response:

```json
{
  "fieldname": "image",
  "originalname": "example.png",
  "encoding": "7bit",
  "mimetype": "image/png",
  "destination": "uploadFiles/",
  "filename": "1234567890.png",
  "path": "uploadFiles/1234567890.png",
  "size": 12345
}
```

#### 다중 이미지 업로드

- **POST** `/api/image/uploadfiles`
- Content-Type: `multipart/form-data`
- Form Data: `image` (파일 배열, 최대 10개)
- Response: 파일 정보 배열

---

## 데이터 모델

### User

```typescript
{
  _id: string;
  username: string;
  email: string;
  accountname: string;
  intro: string;
  image: string;
  password: string;
  following: string[];
  follower: string[];
}
```

### Post

```typescript
{
  id: string;
  content: string;
  image: string; // 쉼표로 구분된 이미지 경로
  createdAt: string;
  updatedAt: string;
  hearted: boolean;
  heartCount: number;
  commentCount: number;
  authorId: string;
  author: User;
}
```

### Comment

```typescript
{
  id: string;
  content: string;
  createdAt: string;
  postId: string;
  authorId: string;
  author: User;
}
```

### Product

```typescript
{
  id: string;
  itemName: string;
  price: number;
  link: string;
  itemImage: string;
  authorId: string;
  createdAt: string;
  author: User;
}
```

---

## 에러 응답

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "message": "에러 메시지",
  "status": "HTTP 상태 코드"
}
```

### 일반적인 에러 코드

- `400` - 잘못된 요청 (유효성 검사 실패)
- `401` - 인증 실패 (토큰 없음 또는 유효하지 않음)
- `404` - 리소스를 찾을 수 없음
- `409` - 중복된 데이터 (이메일, 계정ID)
- `500` - 서버 내부 오류

---

## 기술 스택

- **Express.js** - 웹 프레임워크
- **json-server** - JSON 기반 REST API
- **jsonwebtoken** - JWT 인증
- **multer** - 파일 업로드 처리
- **swagger-jsdoc & swagger-ui-express** - API 문서화
- **nodemon** - 개발 서버 자동 재시작

---

## 라이선스

ISC

---

## 기여

이슈 및 개선 사항은 프로젝트 저장소를 통해 제출해주세요.
