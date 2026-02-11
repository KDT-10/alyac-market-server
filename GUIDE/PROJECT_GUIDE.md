# Alyac Market 프로젝트 가이드

> React 학습을 위한 소셜 마켓플레이스 애플리케이션 실습 프로젝트
> **프로젝트 기간**: 19일 (18일 개발 + 1일 배포/문서화)

---

## 🔗 프로젝트 링크

- **Figma 디자인**: [EST*SECURITY_FE*공유](https://www.figma.com/design/86GxsHTa7nXPKM8S15WOVw/EST_SECURITY_FE_%E1%84%80%E1%85%A9%E1%86%BC%E1%84%8B%E1%85%B2?node-id=7678-92530&t=AFTrd5A8JFpkvwoh-1)
- **프로젝트 URL**: [https://alyac-market-server.web.app/](https://alyac-market-server.web.app/)

---

## 📚 목차

1. [기술 스택](#1-기술-스택)
2. [프로젝트 환경 설정](#2-프로젝트-환경-설정)
3. [아키텍처: Feature-Sliced Design](#3-아키텍처-feature-sliced-design)
4. [Routing 구현 가이드](#4-routing-구현-가이드)
5. [인증 시스템 구현 가이드](#5-인증-시스템-구현-가이드)
6. [API 호출 구현 가이드](#6-api-호출-구현-가이드)
7. [이미지 업로드 구현 가이드](#7-이미지-업로드-구현-가이드)
8. [테마 시스템 구현 가이드](#8-테마-시스템-구현-가이드)
9. [19일 데일리 체크리스트](#9-19일-데일리-체크리스트)
10. [참고 자료](#10-참고-자료)

---

## 1. 기술 스택

### Core Technologies

- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구 (빠른 개발 서버)

### State Management

- **TanStack Query (React Query)** - 서버 상태 관리
- **Context API** - 클라이언트 상태 (Theme, Auth)

### Routing & Forms

- **React Router v7** - 클라이언트 사이드 라우팅
- **React Hook Form** - 폼 관리
- **Zod**(옵션) - 스키마 검증 ([가이드](./ZOD_GUIDE.md))

### Styling

- **Tailwind CSS v4** - 유틸리티 기반 CSS (light-dark() 함수 지원)
- **shadcn/ui** - 재사용 가능한 UI 컴포넌트 ([가이드](./SHADCN_GUIDE.md))

### Icons

- **lucide-react** - 모던하고 일관성 있는 아이콘 라이브러리 ([아이콘 목록](https://lucide.dev/icons/))

  ```tsx
  import { Heart, Search, X } from 'lucide-react';

  <Heart className="h-5 w-5" />
  <Search className="h-4 w-4 text-gray-500" />
  <X className="h-6 w-6" />
  ```

### HTTP & API

- **Axios** - HTTP 클라이언트
- **REST API** - 백엔드 통신

### Architecture

- **Feature-Sliced Design (FSD)** - 프로젝트 구조 방법론

---

## 2. 프로젝트 환경 설정

### 2.1 Prerequisites

```bash
# Node.js 18+ 설치 확인
node --version

# npm 9+ 확인
npm --version
```

### 2.2 Vite로 새 프로젝트 생성

#### Step 1: Vite 프로젝트 생성

```bash
# React + TypeScript 템플릿으로 프로젝트 생성
npm create vite@latest alyac-market -- --template react-ts

# 프로젝트 디렉토리로 이동
cd alyac-market

# 기본 의존성 설치
npm install
```

#### Step 2: 필수 패키지 설치

```bash
# 라우팅
npm install react-router-dom

# 상태 관리
npm install @tanstack/react-query

# 폼 관리
npm install react-hook-form
npm install @hookform/resolvers zod (옵션: zod 사용시 설치)

# HTTP 클라이언트
npm install axios

# 아이콘
npm install lucide-react

# 개발 도구
npm install -D @types/node
```

#### Step 3: Tailwind CSS 설정

> **Note**: Tailwind CSS v4.0은 PostCSS 기반에서 Vite 플러그인으로 변경되었으며, `tailwind.config.js` 파일이 더 이상 필요하지 않습니다.

```bash
# Tailwind CSS v4.0 설치
npm install tailwindcss@next @tailwindcss/vite@next
```

**`vite.config.ts`에 Tailwind 플러그인 추가:**

```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tailwind v4 플러그인 추가
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**`src/app/index.css` 생성 (기본 스타일 및 CSS 변수):**

```css
@import 'tailwindcss';

/* Tailwind v4: @theme 블록으로 커스텀 설정 */
@theme {
  /* Background & Foreground */
  --color-background: light-dark(0 0% 100%, 222.2 84% 4.9%);
  --color-foreground: light-dark(222.2 84% 4.9%, 210 40% 98%);

  /* Border & Input */
  --color-border: light-dark(214.3 31.8% 91.4%, 217.2 32.6% 17.5%);
}

/* Base styles */
:root {
  color-scheme: light;
}

:root.dark {
  color-scheme: dark;
}

* {
  border-color: var(--color-border);
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

**Tailwind v4.0 주요 변경사항:**

1. ✅ **더 이상 `tailwind.config.js` 불필요** - CSS 내에서 모든 설정
2. ✅ **`@import "tailwindcss"`** - 단일 import로 모든 기능 사용
3. ✅ **`@theme` 블록** - CSS 변수 기반 커스텀 테마
4. ✅ **`light-dark()` 함수** - 라이트/다크 모드를 한 줄로 정의
5. ✅ **Vite 플러그인 통합** - 더 빠른 빌드 성능

**다크모드 사용:** [테마 시스템 구현 가이드 참고](#8-테마-시스템-구현-가이드)

```html
<!-- 다크모드는 시스템 설정에 따라 자동 적용됩니다 -->
<!-- 또는 class="dark"를 html/body에 추가하여 수동 전환 가능 -->
```

#### Step 4: 환경 변수 설정

**개발 환경 설정**

프로젝트 루트에 `.env` 파일 생성:

```env
# API Base URLs (개발 환경)
VITE_API_BASE_URL=http://localhost:3000
VITE_IMAGE_BASE_URL=http://localhost:3000
```

**프로덕션 환경 설정**

프로젝트 루트에 `.env.production` 파일 생성:

```env
# API Base URLs (프로덕션 환경)
VITE_API_BASE_URL=https://us-central1-alyac-market-server.cloudfunctions.net
VITE_IMAGE_BASE_URL=https://storage.googleapis.com/alyac-market-server.firebasestorage.app
```

**환경별 파일 구조:**

```
프로젝트 루트/
├── .env                 # 개발 환경 (npm run dev)
├── .env.production      # 프로덕션 환경 (npm run build)
└── .env.example         # 환경 변수 템플릿 (Git에 커밋)
```

**Vite 환경 변수 모드:**

- `npm run dev` → `.env` 파일 사용
- `npm run build` → `.env.production` 파일 사용
- `npm run preview` → `.env.production` 파일 사용

**주의사항:**

- `.env`와 `.env.production` 파일은 `.gitignore`에 포함되어 Git에 커밋되지 않습니다
- 팀원들과 공유할 때는 `.env.example` 파일을 사용하세요
- 배포 시 배포 플랫폼(Vercel, Netlify 등)에서 환경 변수를 직접 설정해야 합니다

#### Step 5: TypeScript 경로 별칭 설정

**`tsconfig.json` 수정:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path Alias */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**`vite.config.ts` 수정:**

```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tailwind CSS v4 플러그인
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### Step 6: FSD 디렉토리 구조 생성

**디렉토리 구조:**

```
src/
├── app/
│   ├── main.tsx         # 엔트리 포인트
│   ├── index.css        # 글로벌 스타일
│   ├── App.tsx          # 루트 컴포넌트
│   ├── routes.tsx       # 라우트 설정
│   ├── layouts/         # 레이아웃 컴포넌트
│   └── providers/       # 글로벌 프로바이더
├── pages/               # 페이지 (라우트 단위)
├── widgets/             # 복잡한 UI 블록
├── features/            # 사용자 인터랙션
├── entities/            # 비즈니스 엔티티
└── shared/              # 공유 인프라
    ├── api/             # API 클라이언트
    ├── ui/              # shadcn/ui 컴포넌트
    ├── lib/             # 유틸리티
    ├── hooks/           # 공유 훅
    ├── config/          # 설정 파일
    └── types/           # 공유 타입
```

#### Step 7: 기본 파일 정리

**기존 Vite 생성 파일 삭제:**

```bash
# src 폴더에서 불필요한 파일 삭제
rm src/App.css
rm src/index.css
rm -rf src/assets
```

**`src/app/main.tsx` 생성:**

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

**`src/app/App.tsx` 생성:**

```typescript
function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <h1 className="text-4xl font-bold text-center py-10">
        Alyac Market
      </h1>
      <p className="text-center text-muted-foreground">
        React + TypeScript + Vite 프로젝트가 성공적으로 설정되었습니다! 🎉
      </p>
    </div>
  );
}

export default App;
```

**`index.html` 수정:**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Alyac Market</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/app/main.tsx"></script>
  </body>
</html>
```

#### Step 8: 개발 서버 실행 및 확인

```bash
# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 접속하여 확인

### 2.3 package.json 스크립트 추가

**`package.json`에 추가할 스크립트:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write \"src/**/*.{js,jsx,ts,tsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{js,jsx,ts,tsx,json,css,md}\""
  }
}
```

### 2.4 ESLint 및 Prettier 설정

#### Prettier 설치 및 설정

```bash
# Prettier 및 플러그인 설치
npm install -D prettier
npm install -D @trivago/prettier-plugin-sort-imports
npm install -D prettier-plugin-tailwindcss
```

**`.prettierrc` 생성:**

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "quoteProps": "as-needed",
  "jsxSingleQuote": false,
  "trailingComma": "all",
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["@trivago/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],
  "importOrder": ["^react$", "^react-dom$", "<THIRD_PARTY_MODULES>", "^@/(.*)$", "^[./]"],
  "importOrderSeparation": true,
  "importOrderSortSpecifiers": true
}
```

**플러그인 설명:**

1. **`@trivago/prettier-plugin-sort-imports`**
   - Import 문을 자동으로 정렬
   - 설정한 순서대로 그룹화 및 정렬
   - 중복 import 방지

2. **`prettier-plugin-tailwindcss`**
   - Tailwind CSS 클래스 자동 정렬
   - 공식 권장 순서로 정렬
   - 가독성 향상

**Import 정렬 규칙:**

```typescript
// 1. React 관련
import { useState } from 'react';
import { createRoot } from 'react-dom/client';

// 2. 써드파티 라이브러리
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/entities/auth';
// 3. @/* 별칭 (프로젝트 내부)
import { Button } from '@/shared/ui';

// 4. 상대 경로
import { ProfileHeader } from './ProfileHeader';
import type { User } from './types';
```

**Tailwind 클래스 정렬 예시:**

```tsx
// Before
<div className="text-center p-4 bg-blue-500 hover:bg-blue-600 rounded-lg">

// After (자동 정렬)
<div className="rounded-lg bg-blue-500 p-4 text-center hover:bg-blue-600">
```

**VSCode 설정 (선택사항):**

`.vscode/settings.json` 생성:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

### 2.5 개발 명령어 정리

```bash
# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 타입 체크
npm run type-check

# 린트 검사
npm run lint

# 코드 포맷팅
npm run format

# 포맷 체크 (수정 없이)
npm run format:check

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

### 2.6 Git 설정

```bash
# Git 초기화 (아직 안했다면)
git init

# .gitignore 확인 (Vite가 자동 생성)
# node_modules, dist, .env 등이 포함되어 있어야 함
```

**`.gitignore`에 추가:**

```
# 환경 변수
.env
.env.local
.env.*.local
.env.production

# IDE
.vscode/*
!.vscode/extensions.json
.idea

# OS
.DS_Store
Thumbs.db
```

---

## 3. 아키텍처: Feature-Sliced Design

### 3.1 FSD 레이어 계층

```
app → pages → widgets → features → entities → shared
```

**규칙**: 하위 레이어는 상위 레이어를 import할 수 없음

### 3.2 레이어별 책임

| 레이어       | 책임                          | 예시                     |
| ------------ | ----------------------------- | ------------------------ |
| **app**      | 앱 초기화, 라우팅, 프로바이더 | main.tsx, routes.tsx     |
| **pages**    | 페이지 조합 (라우트 단위)     | ProfilePage, FeedPage    |
| **widgets**  | 복합 UI 블록                  | FeedList, ProfileHeader  |
| **features** | 사용자 인터랙션               | auth, post-form, comment |
| **entities** | 비즈니스 엔티티               | user, post, product      |
| **shared**   | 공유 인프라                   | api, ui, lib             |

### 3.3 Import 규칙

✅ **허용**

```typescript
// features에서 entities import
import { useGetProfile } from '@/entities/user';
// pages에서 widgets import
import { FeedList } from '@/widgets/feed-list';
```

❌ **금지**

```typescript
// features에서 app import (위반!)
import { useTheme } from '@/app/providers/ThemeProvider';
// widgets끼리 import (위반!)
import { OtherWidget } from '@/widgets/other-widget';
```

### 3.4 Widget 조합 패턴

**❌ 잘못된 방법: Widget이 다른 Widget을 직접 import**

```typescript
// widgets/profile-header/ui/ProfileHeader.tsx
import { ProfileMenu } from '@/widgets/profile-menu';

// 금지!
```

**✅ 올바른 방법: Page 레벨에서 조합**

```typescript
// pages/profile/index.tsx
import { ProfileHeader } from '@/widgets/profile-header';
import { ProfileMenu } from '@/widgets/profile-menu';

export function ProfilePage() {
  return (
    <div>
      <ProfileHeader
        rightContent={<ProfileMenu />} // props로 전달
      />
    </div>
  );
}
```

---

## 4. Routing 구현 가이드

### 4.1 라우팅 설계 및 디렉토리 구조

#### 라우트 설계

프로젝트의 모든 라우트는 `src/app/routes.tsx`에 중앙화되어 관리됩니다.

**주요 라우트:**

| 카테고리   | 경로                         | 설명                   |
| ---------- | ---------------------------- | ---------------------- |
| **인증**   | `/`                          | 홈 (스플래시 → 로그인) |
|            | `/signin`                    | 로그인 (Guest만)       |
|            | `/signup`                    | 회원가입 (Guest만)     |
|            | `/profile-setting`           | 프로필 설정 (Guest만)  |
| **피드**   | `/feed`                      | 메인 피드              |
|            | `/post/:postId`              | 게시물 상세            |
|            | `/post-create`               | 게시물 작성            |
|            | `/post-update/:postId`       | 게시물 수정            |
| **프로필** | `/profile`                   | 내 프로필              |
|            | `/profile/:profileId`        | 타인 프로필            |
|            | `/profile-update`            | 프로필 수정            |
|            | `/followers/:accountname`    | 팔로워 목록            |
|            | `/followings/:accountname`   | 팔로잉 목록            |
| **제품**   | `/product/create`            | 제품 등록              |
|            | `/product-update/:productId` | 제품 수정              |
| **채팅**   | `/chat`                      | 채팅 목록              |
|            | `/chat/:chatId`              | 채팅방                 |
| **검색**   | `/search`                    | 검색                   |
| **기타**   | `*`                          | 404 페이지             |

#### 디렉토리 구조

```
src/
├── app/
│   ├── routes.tsx           # ✅ 라우트 정의 (중앙화)
│   ├── App.tsx              # RouterProvider 설정
│   └── layouts/
│       └── RootLayout.tsx   # 공통 레이아웃
│
├── pages/                   # ✅ 각 라우트에 대응하는 페이지
│   ├── home/
│   │   └── index.tsx        # HomePage - export function
│   ├── signin/
│   │   └── index.tsx        # SignInPage - export function
│   ├── feed/
│   │   └── index.tsx        # FeedPage - export function
│   ├── post/
│   │   └── index.tsx        # PostPage - export function
│   ├── profile/
│   │   └── index.tsx        # ProfilePage - export function
│   └── ...
│
└── features/
    └── auth/
        └── ui/
            └── RequireGuest.tsx  # 라우트 가드
```

### 4.2 React Router v7 설정

#### 라우터 정의 (`src/app/routes.tsx`)

```typescript
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';

// Pages
import { HomePage } from '@/pages/home';
import { SignInPage } from '@/pages/signin';
import { FeedPage } from '@/pages/feed';

// Route Guard - 로그인 상태이면 피드 페이지로 리다이렉트 역할하는 컴포넌트
import { RequireGuest } from '@/features/auth';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      // 로그인이 필요 없는 페이지 (Guest만)
      {
        path: 'signin',
        element: (
          <RequireGuest>
            <SignInPage />
          </RequireGuest>
        ),
      },
      // 보호된 페이지 (인증 필요)
      {
        path: 'feed',
        element: <FeedPage />,
      },
    ],
  },
]);
```

#### App에 라우터 적용 (`src/app/App.tsx`)

```typescript
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
```

### 4.3 라우트 가드 구현

#### Guest 전용 가드 (로그인한 사용자는 리다이렉트)

```typescript
// features/auth/ui/RequireGuest.tsx
import { Navigate } from 'react-router-dom';
import { getToken } from '@/entities/auth';

interface RequireGuestProps {
  children: React.ReactNode;
}

export function RequireGuest({ children }: RequireGuestProps) {
  const token = getToken();

  if (token) {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
}
```

#### 라우트 가드

- **RequireGuest**: 로그인된 사용자를 피드로 리다이렉트 (`/signin`, `/signup`)
- 가드는 `features/auth/ui/`에 구현

### 4.4 네비게이션 사용

```typescript
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

export function MyComponent() {
  const navigate = useNavigate();
  const { postId } = useParams(); // URL 파라미터
  const [searchParams] = useSearchParams(); // 쿼리 스트링

  const handleClick = () => {
    // 프로그래매틱 네비게이션
    navigate('/feed');
    navigate(-1); // 뒤로가기
    navigate(`/post/${postId}`);
  };

  return <button onClick={handleClick}>Go to Feed</button>;
}
```

### 4.5 동적 라우트

```typescript
// routes.tsx
{
  path: 'post/:postId',
  element: <PostDetailPage />,
},
{
  path: 'profile/:profileId?', // ? = optional
  element: <ProfilePage />,
}
```

#### Code Splitting (Lazy Loading)

**모든 페이지는 lazy loading으로 구현**하여 초기 번들 크기를 최적화합니다:

```typescript
// Named export를 사용하므로 .then()으로 변환
const HomePage = lazy(() => import('@/pages/home').then((m) => ({ default: m.HomePage })));

const FeedPage = lazy(() => import('@/pages/feed').then((m) => ({ default: m.FeedPage })));
```

**Suspense Wrapper로 로딩 상태 처리:**

```typescript
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingState />}>
    {children}
  </Suspense>
);

// 라우트에 적용
{
  path: '/feed',
  element: (
    <SuspenseWrapper>
      <FeedPage />
    </SuspenseWrapper>
  ),
}
```

---

## 5. 인증 시스템 구현 가이드

### 5.1 토큰 관리

#### 토큰 저장/조회 (`entities/auth/lib/token.ts`)

```typescript
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// 토큰 저장
export const saveToken = (token: string, refreshToken: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

// 토큰 조회
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// 토큰 삭제 (로그아웃)
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// 토큰 디코딩 (사용자 정보 추출)
export const getTokenUserInfo = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded; // { accountname, email, ... }
  } catch {
    return null;
  }
};
```

### 5.2 Axios 인터셉터로 인증 자동화

#### Axios 인스턴스 설정 (`shared/api/axios.ts`)

```typescript
import axios from 'axios';

import { getRefreshToken, getToken, removeToken, saveToken } from '@/entities/auth';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// 요청 인터셉터: 토큰 자동 추가
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 응답 인터셉터: 401 처리 및 토큰 갱신
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러 && 재시도 안한 요청
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 갱신 중이면 대기
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        // Refresh token 없으면 로그아웃
        removeToken();
        window.location.href = '/signin';
        return Promise.reject(error);
      }

      try {
        // Refresh token으로 새 토큰 요청
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/user/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          },
        );

        const { token: newToken, refreshToken: newRefreshToken } = response.data;
        saveToken(newToken, newRefreshToken);

        // 대기 중인 요청들에 새 토큰 전달
        onTokenRefreshed(newToken);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh 실패 시 로그아웃
        removeToken();
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
```

### 5.3 로그인 구현

#### API 함수 (`entities/auth/api/signin.ts`)

```typescript
import axiosInstance from '@/shared/api/axios';

import type { SignInRequest, SignInResponse } from '../model/types';

export const signIn = async (data: SignInRequest): Promise<SignInResponse> => {
  const response = await axiosInstance.post('/user/login', {
    user: {
      email: data.email,
      password: data.password,
    },
  });
  return response.data;
};
```

#### React Query Hook (`entities/auth/hooks/useSignIn.ts`)

```typescript
import { useMutation } from '@tanstack/react-query';

import { signIn } from '../api/signin';
import { saveToken } from '../lib/token';

export const useSignIn = () => {
  return useMutation({
    mutationFn: signIn,
    onSuccess: (data) => {
      // 토큰 저장
      saveToken(data.user.token, data.user.refreshToken);
    },
  });
};
```

#### 로그인 폼 (`features/auth/ui/SignInForm.tsx`)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSignIn } from '@/entities/auth';
import { useNavigate } from 'react-router-dom';

const signInSchema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상입니다'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInForm() {
  const navigate = useNavigate();
  const signInMutation = useSignIn();

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: SignInFormData) => {
    signInMutation.mutate(data, {
      onSuccess: () => {
        navigate('/feed');
      },
      onError: (error) => {
        alert('로그인 실패: ' + error.message);
      },
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('email')} placeholder="Email" />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}

      <input
        {...form.register('password')}
        type="password"
        placeholder="Password"
      />
      {form.formState.errors.password && (
        <span>{form.formState.errors.password.message}</span>
      )}

      <button type="submit" disabled={signInMutation.isPending}>
        {signInMutation.isPending ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
}
```

### 5.4 로그아웃 구현

```typescript
import { useNavigate } from 'react-router-dom';

import { removeToken } from '@/entities/auth';

export function useAuth() {
  const navigate = useNavigate();

  const logout = () => {
    removeToken();
    navigate('/signin');
  };

  const isAuthenticated = () => {
    return !!getToken();
  };

  return { logout, isAuthenticated };
}
```

---

## 6. API 호출 구현 가이드

### 6.1 Entity 구조

각 엔티티는 다음 구조를 따릅니다:

```
entities/[entity-name]/
├── model/        # 타입 정의
│   └── types.ts
├── api/          # API 함수
│   └── getUser.ts
├── hooks/        # React Query 훅
│   └── useGetUser.ts
└── index.ts      # Public API
```

### 6.2 타입 정의

```typescript
// entities/post/model/types.ts
export interface Post {
  id: string;
  content: string;
  image: string;
  createdAt: string;
  author: {
    accountname: string;
    username: string;
    image: string;
  };
  commentCount: number;
  heartCount: number;
  hearted: boolean;
}

export interface GetPostsResponse {
  posts: Post[];
}
```

### 6.3 API 함수 작성

```typescript
// entities/post/api/getPosts.ts
import axiosInstance from '@/shared/api/axios';

import type { GetPostsResponse } from '../model/types';

export const getPosts = async (limit?: number): Promise<GetPostsResponse> => {
  const params = limit ? { limit } : {};
  const response = await axiosInstance.get('/post', { params });
  return response.data;
};
```

### 6.4 React Query Hook 작성

```typescript
// entities/post/hooks/useGetPosts.ts
import { useQuery } from '@tanstack/react-query';

import { getPosts } from '../api/getPosts';

export const useGetPosts = (limit?: number) => {
  return useQuery({
    queryKey: ['posts', limit],
    queryFn: () => getPosts(limit),
    staleTime: 5 * 60 * 1000, // 5분
  });
};
```

### 6.5 컴포넌트에서 사용

```typescript
// widgets/feed-list/ui/FeedList.tsx
import { useGetPosts } from '@/entities/post';

export function FeedList() {
  const { data, isLoading, isError } = useGetPosts();

  if (isLoading) return <div>로딩 중...</div>;
  if (isError) return <div>에러 발생</div>;

  return (
    <div>
      {data.posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### 6.6 Mutation (생성/수정/삭제)

```typescript
// entities/post/api/createPost.ts
import axiosInstance from '@/shared/api/axios';
import type { CreatePostRequest, CreatePostResponse } from '../model/types';

export const createPost = async (data: CreatePostRequest): Promise<CreatePostResponse> => {
  const response = await axiosInstance.post('/post', {
    post: {
      content: data.content,
      image: data.image,
    },
  });
  return response.data;
};

// entities/post/hooks/useCreatePost.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from '../api/createPost';

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      // 캐시 무효화 (목록 새로고침)
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

// 컴포넌트에서 사용
export function PostForm() {
  const createPostMutation = useCreatePost();

  const handleSubmit = (data) => {
    createPostMutation.mutate(data, {
      onSuccess: () => {
        alert('게시물 작성 완료!');
      },
      onError: (error) => {
        alert('작성 실패: ' + error.message);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 폼 필드 */}
      <button disabled={createPostMutation.isPending}>
        {createPostMutation.isPending ? '작성 중...' : '작성하기'}
      </button>
    </form>
  );
}
```

---

## 7. 이미지 업로드 구현 가이드

### 7.1 Upload API 설정

```typescript
// shared/api/uploadApi.ts
import axios from 'axios';

import { getToken } from '@/entities/auth';

const uploadApi = axios.create({
  baseURL: import.meta.env.VITE_UPLOAD_BASE_URL,
  timeout: 30000,
});

// 요청 인터셉터
uploadApi.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default uploadApi;
```

### 7.2 이미지 업로드 API

```typescript
// entities/upload/api/uploadFiles.ts
import uploadApi from '@/shared/api/uploadApi';

export interface UploadResponse {
  filename: string;
}

export const uploadFiles = async (files: File[]): Promise<UploadResponse[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('image', file);
  });

  const response = await uploadApi.post('/image/uploadfiles', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
```

### 7.3 업로드 Hook

```typescript
// entities/upload/hooks/useUploadFiles.ts
import { useMutation } from '@tanstack/react-query';

import { uploadFiles } from '../api/uploadFiles';

export const useUploadFiles = () => {
  return useMutation({
    mutationFn: uploadFiles,
  });
};
```

### 7.4 이미지 업로드 컴포넌트

```typescript
// features/upload/ui/ImageUpload.tsx
import { useState } from 'react';
import { useUploadFiles } from '@/entities/upload';

interface ImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
}

export function ImageUpload({ onUploadComplete, maxFiles = 3 }: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const uploadMutation = useUploadFiles();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length > maxFiles) {
      alert(`최대 ${maxFiles}개까지 업로드 가능합니다.`);
      return;
    }

    // 미리보기 생성
    const previewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviews(previewUrls);

    // 서버 업로드
    uploadMutation.mutate(files, {
      onSuccess: (data) => {
        const urls = data.map((item) => item.filename);
        onUploadComplete(urls);
      },
      onError: (error) => {
        alert('업로드 실패: ' + error.message);
        setPreviews([]);
      },
    });
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        disabled={uploadMutation.isPending}
      />

      {uploadMutation.isPending && <div>업로드 중...</div>}

      <div className="preview-container">
        {previews.map((url, index) => (
          <img key={index} src={url} alt={`Preview ${index}`} />
        ))}
      </div>
    </div>
  );
}
```

### 7.5 이미지 URL 헬퍼

```typescript
// shared/lib/imageUrl.ts
export const imageUrl = (path: string | undefined): string => {
  if (!path) return '/default-image.png';

  const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL;
  return `${baseUrl}${path}`;
};

// 사용 예시
import { imageUrl } from '@/shared/lib';

<img src={imageUrl(user.image)} alt={user.username} />
```

### 7.6 다중 이미지 저장

```typescript
// 서버는 쉼표로 구분된 문자열로 저장
const imageUrls = ['path1.jpg', 'path2.jpg', 'path3.jpg'];
const imageString = imageUrls.join(',');

// API 요청
await createPost({
  content: 'Hello',
  image: imageString, // "path1.jpg,path2.jpg,path3.jpg"
});

// 표시할 때 다시 배열로 변환
const images = post.image.split(',');
images.forEach((img) => {
  console.log(imageUrl(img));
});
```

---

## 8. 테마 시스템 구현 가이드

### 8.1 테마 타입 정의

```typescript
// shared/lib/theme/types.ts
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}
```

### 8.2 ThemeProvider 구현

```typescript
// shared/lib/theme/ThemeProvider.tsx
import { createContext, useEffect, useState } from 'react';
import type { Theme, ThemeContextType } from './types';

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const applySystemTheme = () => {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(systemTheme);
      };

      applySystemTheme();
      mediaQuery.addEventListener('change', applySystemTheme);

      return () => {
        mediaQuery.removeEventListener('change', applySystemTheme);
      };
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
```

### 8.3 useTheme Hook

```typescript
// shared/lib/theme/useTheme.ts
import { useContext } from 'react';

import { ThemeContext } from './context';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

### 8.4 ThemeToggle 컴포넌트

```typescript
// features/theme/ui/ThemeToggle.tsx
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/shared/lib/theme';
import { Button } from '@/shared/ui';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      case 'dark':
        return <Moon className="h-5 w-5" />;
      case 'system':
        return <Monitor className="h-5 w-5" />;
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={cycleTheme}>
      {getIcon()}
    </Button>
  );
}
```

### 8.5 Tailwind CSS 다크모드 설정

> **Note**: Tailwind CSS v4.0에서는 `tailwind.config.js` 파일 없이 CSS에서 직접 다크모드를 설정합니다.

**`src/app/index.css`에서 이미 설정 완료:**

Step 3에서 작성한 `@theme` 블록이 다크모드를 자동으로 처리합니다:

```css
/* src/app/index.css */
@import 'tailwindcss';

@theme {
  /* Dark mode 설정 */
  --color-background: light-dark(0 0% 100%, 222.2 84% 4.9%);
  --color-foreground: light-dark(222.2 84% 4.9%, 210 40% 98%);

  /* Card 색상 */
  --color-card: light-dark(0 0% 100%, 222.2 84% 4.9%);
  --color-card-foreground: light-dark(222.2 84% 4.9%, 210 40% 98%);

  /* Popover 색상 */
  --color-popover: light-dark(0 0% 100%, 222.2 84% 4.9%);
  --color-popover-foreground: light-dark(222.2 84% 4.9%, 210 40% 98%);

  /* Primary 색상 */
  --color-primary: light-dark(222.2 47.4% 11.2%, 210 40% 98%);
  --color-primary-foreground: light-dark(210 40% 98%, 222.2 47.4% 11.2%);

  /* Secondary 색상 */
  --color-secondary: light-dark(210 40% 96.1%, 217.2 32.6% 17.5%);
  --color-secondary-foreground: light-dark(222.2 47.4% 11.2%, 210 40% 98%);

  /* Muted 색상 */
  --color-muted: light-dark(210 40% 96.1%, 217.2 32.6% 17.5%);
  --color-muted-foreground: light-dark(215.4 16.3% 46.9%, 215 20.2% 65.1%);

  /* Accent 색상 */
  --color-accent: light-dark(210 40% 96.1%, 217.2 32.6% 17.5%);
  --color-accent-foreground: light-dark(222.2 47.4% 11.2%, 210 40% 98%);

  /* Destructive 색상 */
  --color-destructive: light-dark(0 84.2% 60.2%, 0 62.8% 30.6%);
  --color-destructive-foreground: light-dark(210 40% 98%, 210 40% 98%);

  /* Border & Input */
  --color-border: light-dark(214.3 31.8% 91.4%, 217.2 32.6% 17.5%);
  --color-input: light-dark(214.3 31.8% 91.4%, 217.2 32.6% 17.5%);
  --color-ring: light-dark(222.2 84% 4.9%, 212.7 26.8% 83.9%);

  /* Border Radius */
  --radius-lg: 0.5rem;
  --radius-md: calc(0.5rem - 2px);
  --radius-sm: calc(0.5rem - 4px);
}

:root {
  color-scheme: light;
}

:root.dark {
  color-scheme: dark;
}
```

**다크모드 작동 방식:**

1. **자동 감지** - `prefers-color-scheme` 미디어 쿼리로 시스템 테마 자동 감지
2. **`light-dark()` 함수** - 첫 번째 값은 라이트 모드, 두 번째 값은 다크 모드
3. **수동 전환** - ThemeProvider에서 `class="dark"`를 HTML에 추가/제거

**수동 다크모드 전환 (ThemeProvider 사용):**

ThemeProvider가 HTML에 `dark` 클래스를 추가하면 다크모드가 활성화됩니다:

```typescript
// ThemeProvider에서 자동으로 처리
document.documentElement.classList.add('dark'); // 다크모드
document.documentElement.classList.remove('dark'); // 라이트모드
```

**v4.0 다크모드 장점:**

- ✅ **설정 파일 불필요** - CSS만으로 완전한 다크모드
- ✅ **자동 감지** - 시스템 설정에 따라 자동 적용
- ✅ **간편한 전환** - `light-dark()` 함수로 한 줄에 정의
- ✅ **성능 최적화** - CSS 네이티브 방식

### 8.6 앱에 적용

```typescript
// app/providers/index.tsx
import { ThemeProvider } from '@/shared/lib/theme';

export function AppProviders({ children }) {
  return (
    <ThemeProvider defaultTheme="system">
      {/* 다른 프로바이더들 */}
      {children}
    </ThemeProvider>
  );
}
```

---

## 9. 19일 데일리 체크리스트

### 📅 Week 1: 기초 설정 및 인증 (Day 1-5)

#### Day 1: 프로젝트 세팅

- [ ] 프로젝트 클론 및 의존성 설치
- [ ] 환경 변수 설정 (.env 파일)
- [ ] 개발 서버 실행 확인
- [ ] FSD 아키텍처 문서 읽기 (CLAUDE.md)
- [ ] Git 브랜치 전략 논의 및 설정
- [ ] 팀 컨벤션 정의 (코드 스타일, 커밋 메시지)

#### Day 2: 라우팅 및 레이아웃

- [ ] React Router v7 설정 완료
- [ ] 기본 라우트 정의 (/, /signin, /signup, /feed)
- [ ] RootLayout 컴포넌트 작성
- [ ] 네비게이션 바 구현
- [ ] 404 페이지 구현
- [ ] 라우팅 테스트

#### Day 3: 인증 시스템 (로그인)

- [ ] 토큰 관리 유틸리티 작성 (localStorage)
- [ ] Axios 인스턴스 설정
- [ ] 로그인 API 연동
- [ ] 로그인 폼 구현 (React Hook Form + Zod)
- [ ] 로그인 성공 시 토큰 저장 및 리다이렉트
- [ ] 에러 처리 구현

#### Day 4: 인증 시스템 (회원가입 & Refresh Token)

- [ ] 회원가입 API 연동
- [ ] 회원가입 폼 구현
- [ ] Axios 인터셉터로 토큰 자동 추가
- [ ] Refresh Token 로직 구현
- [ ] 401 에러 처리 및 자동 갱신
- [ ] 로그아웃 기능 구현

#### Day 5: 라우트 가드 및 인증 완성

- [ ] RequireGuest 가드 구현
- [ ] 프로필 정보 조회 API 연동
- [ ] 사용자 컨텍스트 구현
- [ ] 네비게이션 바에 로그아웃 버튼
- [ ] 인증 플로우 전체 테스트
- [ ] Week 1 회고 및 코드 리뷰

---

### 📅 Week 2: 핵심 기능 구현 (Day 6-10)

#### Day 6: 게시물 목록 (Feed)

- [ ] Post 엔티티 타입 정의
- [ ] 게시물 목록 조회 API 연동
- [ ] useGetPosts 훅 작성
- [ ] FeedList 위젯 구현
- [ ] PostCard 컴포넌트 구현
- [ ] 무한 스크롤 또는 페이지네이션 구현

#### Day 7: 게시물 상세 및 댓글

- [ ] 게시물 상세 조회 API 연동
- [ ] PostDetail 페이지 구현
- [ ] 댓글 목록 조회 API 연동
- [ ] CommentList 위젯 구현
- [ ] 댓글 작성 폼 구현
- [ ] 댓글 작성 API 연동

#### Day 8: 이미지 업로드 및 게시물 작성

- [ ] 이미지 업로드 API 설정
- [ ] ImageUpload 컴포넌트 구현
- [ ] 이미지 미리보기 기능
- [ ] 게시물 작성 폼 구현
- [ ] 게시물 작성 API 연동
- [ ] 다중 이미지 업로드 처리

#### Day 9: 좋아요 및 팔로우

- [ ] 좋아요 기능 API 연동
- [ ] 좋아요 버튼 컴포넌트
- [ ] 팔로우 기능 API 연동
- [ ] 팔로우 버튼 컴포넌트
- [ ] Optimistic Updates 구현
- [ ] 캐시 무효화 처리

#### Day 10: 프로필 페이지

- [ ] 프로필 조회 API 연동
- [ ] ProfileHeader 위젯 구현
- [ ] 사용자 게시물 목록 표시
- [ ] 팔로워/팔로잉 목록 페이지
- [ ] 프로필 수정 폼 구현
- [ ] Week 2 회고 및 코드 리뷰

---

### 📅 Week 3: 추가 기능 및 완성 (Day 11-18)

#### Day 11: 상품 기능

- [ ] Product 엔티티 타입 정의
- [ ] 상품 목록 조회 API 연동
- [ ] 상품 카드 컴포넌트
- [ ] 상품 등록 폼 구현
- [ ] 상품 등록 API 연동
- [ ] 상품 수정/삭제 기능

#### Day 12: 검색 기능

- [ ] 검색 API 연동
- [ ] 검색 입력 컴포넌트
- [ ] Debounce 처리 (useDebouncedValue)
- [ ] 검색 결과 표시
- [ ] 검색 히스토리 구현
- [ ] 검색 필터 추가

#### Day 13: 채팅 기능 (API 연동 없음)

- [ ] 채팅방 목록 조회 화면
- [ ] 채팅 메시지 조회 화면
- [ ] ChatList 위젯 구현
- [ ] ChatRoom 페이지 구현
- [ ] 메시지 전송 기능
- [ ] 메시지 목록 표시

#### Day 14: 테마 시스템

- [ ] ThemeProvider 구현
- [ ] useTheme 훅 작성
- [ ] ThemeToggle 컴포넌트
- [ ] Tailwind 다크모드 설정
- [ ] CSS 변수 정의 (라이트/다크)
- [ ] 전체 앱 테마 적용 테스트

#### Day 15: UI/UX 개선

- [ ] 로딩 스피너 컴포넌트
- [ ] 에러 바운더리 구현
- [ ] Toast 알림 시스템
- [ ] 스켈레톤 로더 추가
- [ ] 접근성 (a11y) 점검
- [ ] 코드 리펙토링 및 점검

#### Day 16: 성능 최적화

- [ ] React.memo 적용
- [ ] useMemo/useCallback 최적화
- [ ] 이미지 레이지 로딩
- [ ] 코드 스플리팅 (React.lazy)
- [ ] React Query 캐시 전략 최적화
- [ ] Lighthouse 성능 점수 확인

#### Day 17: 테스트 및 버그 수정

- [ ] 전체 기능 통합 테스트
- [ ] 크로스 브라우저 테스트
- [ ] 모바일 디바이스 테스트
- [ ] 버그 트래킹 및 수정
- [ ] 코드 리팩토링
- [ ] ESLint/Prettier 정리

#### Day 18: 최종 완성

- [ ] 최종 기능 점검
- [ ] 사용자 시나리오 테스트
- [ ] 남은 버그 수정
- [ ] 코드 리뷰 및 머지
- [ ] 배포 준비 (환경 변수 확인)
- [ ] README 업데이트

---

### 📅 Day 19: 배포 및 문서화

#### 배포 (github pages/vercel/netlify/firebase 추천)

- [ ] 프로덕션 빌드 테스트 (`npm run build`)
- [ ] 환경 변수 설정 (배포 플랫폼)
- [ ] 배포 실행
- [ ] 배포된 사이트 확인
- [ ] 프로덕션 환경 테스트
- [ ] 프로젝트 결과보고서 작성

#### 문서화

- [ ] 프로젝트 README 작성
  - 프로젝트 소개
  - 주요 기능
  - 기술 스택
  - 설치 및 실행 방법
  - 배포 URL
  - 팀원 소개
- [ ] 회고록 작성
  - 구현한 기능 요약
  - 기술적 도전과 해결 방법
  - 배운 점
  - 개선 사항
- [ ] 스크린샷 및 데모 영상 준비
- [ ] 발표 자료 준비 (PPT/노션)

---

## 10. 참고 자료

### 공식 문서

- [React 공식 문서](https://react.dev/)
- [TypeScript 공식 문서](https://www.typescriptlang.org/docs/)
- [Vite 공식 문서](https://vitejs.dev/)
- [React Router v7 문서](https://reactrouter.com/)
- [TanStack Query 문서](https://tanstack.com/query/latest)
- [React Hook Form 문서](https://react-hook-form.com/)
- [Zod 문서](https://zod.dev/)
- [Tailwind CSS 문서](https://tailwindcss.com/)
- [shadcn/ui 문서](https://ui.shadcn.com/)

### 아키텍처

- [Feature-Sliced Design 공식 문서](https://feature-sliced.design/)
- [FSD 한글 가이드](https://emewjin.github.io/feature-sliced-design/)

### 학습 자료

- [React 공식 튜토리얼](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Axios 가이드](https://axios-http.com/docs/intro)

### 도구

- [React DevTools](https://react.dev/learn/react-developer-tools)
- [TanStack Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
- [VSCode Extensions](https://code.visualstudio.com/docs/editor/extension-marketplace)
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Error Lens

---

## 💡 팁 및 주의사항

### 개발 팁

1. **작은 단위로 커밋**: 기능 단위로 커밋하여 롤백이 쉽게
2. **브랜치 전략**: `main` ← `develop` ← `feature/기능명`
3. **코드 리뷰**: 매일 또는 격일로 팀 코드 리뷰 진행
4. **페어 프로그래밍**: 어려운 부분은 함께 해결
5. **문서화**: 복잡한 로직은 주석으로 설명

### FSD 준수 체크리스트

- [ ] 하위 레이어가 상위 레이어를 import하지 않는가?
- [ ] Widget끼리 직접 import하지 않는가?
- [ ] Infrastructure 코드는 shared에 있는가?
- [ ] 각 레이어는 index.ts로 export하는가?

### 일반적인 실수 방지

- ❌ `any` 타입 사용 자제 → 명확한 타입 정의
- ❌ useEffect 남용 → React Query 활용
- ❌ Props drilling → Context API 또는 상태 관리 라이브러리
- ❌ 하드코딩된 값 → 환경 변수 또는 상수로 관리
- ❌ 에러 처리 누락 → try-catch 및 error boundary 활용

---

## 🎯 프로젝트 성공 기준

### 필수 기능 (Must Have)

- ✅ 회원가입/로그인/로그아웃
- ✅ Refresh Token 자동 갱신
- ✅ 게시물 CRUD
- ✅ 댓글 기능
- ✅ 좋아요 기능
- ✅ 이미지 업로드
- ✅ 프로필 조회/수정
- ✅ 반응형 디자인

### 권장 기능 (Should Have)

- ✅ 팔로우/언팔로우
- ✅ 검색 기능
- ✅ 무한 스크롤
- ✅ 다크모드
- ✅ 상품 등록

### 선택 기능 (Nice to Have)

- ⭐ 채팅 기능
- ⭐ 알림 시스템
- ⭐ 이미지 편집
- ⭐ PWA 지원

---

## 📞 도움이 필요할 때

### 팀 내 해결

1. 팀원들과 토론
2. CLAUDE.md 및 이 가이드 참조
3. 공식 문서 확인

### 외부 자원

1. [Stack Overflow](https://stackoverflow.com/)
2. [GitHub Issues](https://github.com/)
3. [Discord 커뮤니티](https://discord.com/)
4. 강사/멘토에게 질문

---

**🎓 학습 목표를 달성하고, 협업을 통해 성장하는 프로젝트가 되길 바랍니다!**

**Good luck! 🚀**
