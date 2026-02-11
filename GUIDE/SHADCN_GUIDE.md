# shadcn/ui 사용 가이드

이 문서는 Alyac Market 프로젝트에서 shadcn/ui 컴포넌트를 설정하고 사용하는 방법을 설명합니다.

## 목차

- [개요](#개요)
- [프로젝트 설정](#프로젝트-설정)
- [새 컴포넌트 추가하기](#새-컴포넌트-추가하기)
- [설치된 컴포넌트](#설치된-컴포넌트)
- [컴포넌트 사용 방법](#컴포넌트-사용-방법)
- [커스텀 컴포넌트 만들기](#커스텀-컴포넌트-만들기)
- [스타일링 및 테마](#스타일링-및-테마)
- [FSD 아키텍처 통합](#fsd-아키텍처-통합)
- [베스트 프랙티스](#베스트-프랙티스)

## 개요

shadcn/ui는 복사하여 사용하는 컴포넌트 라이브러리입니다. npm 패키지로 설치되지 않고, CLI를 통해 프로젝트에 직접 복사됩니다.

### 핵심 특징

- **복사-붙여넣기 방식**: 컴포넌트 소스 코드가 프로젝트에 직접 추가되어 완전한 커스터마이징 가능
- **Radix UI 기반**: 접근성과 UX가 뛰어난 Radix UI 프리미티브 사용
- **Tailwind CSS**: Tailwind CSS v4를 사용한 스타일링
- **TypeScript 지원**: 완전한 타입 안전성 제공

### 기술 스택

- **React 19** + **TypeScript**
- **Tailwind CSS v4** (light-dark() 함수 지원)
- **class-variance-authority** (cva) - 컴포넌트 variants 관리
- **tailwind-merge** + **clsx** - 클래스 이름 병합
- **Radix UI** - 접근성 높은 UI 프리미티브

## 프로젝트 설정

새 프로젝트에 shadcn/ui를 설정하는 방법을 설명합니다.

### 1. shadcn/ui 초기화

프로젝트 루트에서 shadcn/ui를 초기화합니다:

```bash
npx shadcn@latest init
```

### 2. 대화형 설정 (FSD 아키텍처 기준)

CLI가 다음 질문들을 할 것입니다. **FSD 아키텍처를 따르는 경우** 아래와 같이 답변하세요:

```
✔ Preflight checks.
✔ Verifying framework. Found Vite.
✔ Validating Tailwind CSS.

✔ Which style would you like to use? › Default
✔ Which color would you like to use as base color? › Slate
✔ Would you like to use CSS variables for colors? › yes

✔ Where is your global CSS file? › src/app/index.css
✔ Would you like to use CSS variables for colors? › yes
✔ Are you using a custom tailwind prefix eg. tw-? (Leave blank if not) ›

✔ Where is your tailwind.config.js located? › (Leave blank - Tailwind v4는 config 파일 불필요)
✔ Configure the import alias for components: › @/shared/ui
✔ Configure the import alias for utils: › @/shared/lib
✔ Are you using React Server Components? › no
✔ Write configuration to components.json. Proceed? › yes
```

### 3. 설정 옵션 설명

| 질문                         | 추천 답변           | 설명                                          |
| ---------------------------- | ------------------- | --------------------------------------------- |
| **Which style?**             | `Default`           | 기본 스타일 (New York, Default 중 선택)       |
| **Base color?**              | `Slate`             | 기본 색상 팔레트 (Slate, Gray, Zinc 등)       |
| **CSS variables?**           | `Yes`               | CSS 변수 사용 (테마 전환에 필수)              |
| **Global CSS file?**         | `src/app/index.css` | FSD: app layer의 index.css                    |
| **Tailwind config?**         | _(빈 값)_           | Tailwind v4는 config 파일 불필요 (CSS로 설정) |
| **Components alias?**        | `@/shared/ui`       | **FSD: shared/ui layer**                      |
| **Utils alias?**             | `@/shared/lib`      | **FSD: shared/lib layer**                     |
| **React Server Components?** | `No`                | CSR 프로젝트는 No                             |

### 4. 생성된 components.json

초기화 후 다음과 같은 `components.json` 파일이 생성됩니다:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/shared/ui",
    "ui": "@/shared/ui",
    "utils": "@/shared/lib"
  }
}
```

### 5. Path Alias 설정

`vite.config.ts`에 path alias를 추가해야 합니다:

```typescript
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**TypeScript 설정** (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 6. 유틸리티 함수 생성

`src/shared/lib/utils.ts` 파일이 자동으로 생성됩니다:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**필요한 패키지가 자동 설치됩니다:**

- `tailwind-merge` - Tailwind 클래스 병합
- `clsx` - 조건부 클래스 이름 처리
- `class-variance-authority` - 컴포넌트 variants 관리

### 7. 디렉토리 구조 확인

초기화 후 다음 구조를 확인하세요:

```
프로젝트/
├── components.json          # shadcn/ui 설정
├── src/
│   ├── app/
│   │   └── index.css        # 글로벌 CSS (Tailwind + 테마)
│   └── shared/
│       ├── ui/              # shadcn/ui 컴포넌트가 추가될 위치
│       └── lib/
│           └── utils.ts     # cn() 유틸리티 함수
├── tsconfig.json
└── vite.config.ts
```

### 8. 첫 번째 컴포넌트 추가

설정이 완료되면 첫 컴포넌트를 추가해보세요:

```bash
npx shadcn@latest add button
```

컴포넌트가 `src/shared/ui/button.tsx`에 생성됩니다.

### 문제 해결

**Path alias가 작동하지 않는 경우:**

1. `vite.config.ts`에서 alias 설정 확인
2. `tsconfig.json`에서 paths 설정 확인
3. VS Code를 재시작 (TypeScript 서버 재시작)

**패키지 설치 오류:**

```bash
# 수동으로 필요한 패키지 설치
npm install clsx tailwind-merge class-variance-authority
npm install -D @types/node
```

## 새 컴포넌트 추가하기

### 기본 사용법

```bash
npx shadcn@latest add [component-name]
```

### 예시

```bash
# Button 컴포넌트 추가
npx shadcn@latest add button

# 여러 컴포넌트 한 번에 추가
npx shadcn@latest add button input label card

# 모든 컴포넌트 추가 (권장하지 않음)
npx shadcn@latest add --all
```

### 컴포넌트 추가 후 구조

컴포넌트는 `src/shared/ui/` 디렉토리에 추가됩니다:

```
src/shared/ui/
├── button.tsx        # Button 컴포넌트
├── input.tsx         # Input 컴포넌트
├── avatar.tsx        # Avatar 컴포넌트
├── alert-dialog.tsx  # AlertDialog 컴포넌트
└── ...
```

## 필요하다고 예상되는 컴포넌트 - 필요한 시점에 설치해서 사용

현재 프로젝트에 필요할 것으로 예상되는 shadcn/ui 컴포넌트:

### UI 컴포넌트

- ✅ **Button** (`button.tsx`) - 다양한 variant를 지원하는 버튼
- ✅ **Input** (`input.tsx`) - 텍스트 입력 필드
- ✅ **Textarea** (`textarea.tsx`) - 여러 줄 텍스트 입력
- ✅ **Avatar** (`avatar.tsx`) - 프로필 이미지 표시
- ✅ **Popover** (`popover.tsx`) - 팝오버 메뉴
- ✅ **AlertDialog** (`alert-dialog.tsx`) - 확인 대화상자

### 의존성으로 설치되는 Radix UI 패키지

```json
"@radix-ui/react-alert-dialog": "^1.1.15",
"@radix-ui/react-popover": "^1.1.15",
"@radix-ui/react-slot": "^1.2.4"
```

## 컴포넌트 사용 방법

### Button 컴포넌트

Button은 여러 variant와 size를 지원합니다.

**기본 사용법**

```tsx
import { Button } from '@/shared/ui/button';

export function MyComponent() {
  return <Button onClick={() => console.log('clicked')}>Click me</Button>;
}
```

**Variants**

```tsx
// Default (primary) 버튼
<Button variant="default">Primary</Button>

// 파괴적인 작업용 버튼
<Button variant="destructive">Delete</Button>

// 외곽선 버튼
<Button variant="outline">Outline</Button>

// 보조 버튼
<Button variant="secondary">Secondary</Button>

// Ghost 버튼 (배경 없음)
<Button variant="ghost">Ghost</Button>

// 링크 스타일 버튼
<Button variant="link">Link</Button>
```

**Sizes**

```tsx
// 기본 크기
<Button size="default">Default</Button>

// 작은 크기
<Button size="sm">Small</Button>

// 큰 크기
<Button size="lg">Large</Button>

// 아이콘 전용 (정사각형)
<Button size="icon">
  <IconComponent />
</Button>
```

**실제 사용 예시** (src/features/post-form/ui/PostFormHeader.tsx:21-29)

```tsx
import { Button } from '@/shared/ui/button';
import { ArrowLeftIcon } from '@/shared/ui/icons/arrow-left-icon';

<Button
  type="button"
  variant="ghost"
  size="icon"
  onClick={onBack}
  className="text-foreground hover:text-foreground/80"
>
  <ArrowLeftIcon className="h-6 w-6" />
</Button>;
```

**커스텀 스타일 적용**

```tsx
<Button className="rounded-full bg-[#6FCA3C] px-8 py-0.5 font-medium text-white transition-colors hover:bg-[#5CB32A]">
  Custom Styled
</Button>
```

**asChild prop (고급)**

Button을 다른 컴포넌트로 렌더링 (예: React Router Link):

```tsx
import { Link } from 'react-router-dom';

<Button asChild variant="ghost">
  <Link to="/profile">Go to Profile</Link>
</Button>;
```

### Input 컴포넌트

**기본 사용법**

```tsx
import { Input } from '@/shared/ui/input';

<Input
  type="text"
  placeholder="Enter your name"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>;
```

**다양한 type**

```tsx
// 텍스트 입력
<Input type="text" placeholder="Username" />

// 이메일 입력
<Input type="email" placeholder="email@example.com" />

// 비밀번호 입력
<Input type="password" placeholder="Password" />

// 숫자 입력
<Input type="number" min={0} max={100} />

// 파일 업로드
<Input type="file" accept="image/*" />
```

**React Hook Form과 함께 사용**

```tsx
import { useForm } from 'react-hook-form';

import { Input } from '@/shared/ui/input';

export function LoginForm() {
  const { register, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('email')} type="email" placeholder="Email" />
      <Input {...register('password')} type="password" placeholder="Password" />
    </form>
  );
}
```

### Avatar 컴포넌트

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

<Avatar>
  <AvatarImage src="/profile.jpg" alt="User Name" />
  <AvatarFallback>UN</AvatarFallback>
</Avatar>;
```

### Textarea 컴포넌트

```tsx
import { Textarea } from '@/shared/ui/textarea';

<Textarea
  placeholder="Enter your message..."
  rows={4}
  value={message}
  onChange={(e) => setMessage(e.target.value)}
/>;
```

### AlertDialog 컴포넌트

확인/취소 대화상자를 만들 때 사용합니다.

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete Account</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete your account.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>;
```

### Popover 컴포넌트

```tsx
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <div className="space-y-2">
      <h4 className="font-medium">Settings</h4>
      <p className="text-sm">Manage your account settings.</p>
    </div>
  </PopoverContent>
</Popover>;
```

## 커스텀 컴포넌트 만들기

프로젝트에서는 shadcn/ui 컴포넌트를 조합하여 재사용 가능한 커스텀 컴포넌트를 만들 수 있습니다.

### FormField 컴포넌트 예시

**위치**: `src/shared/ui/form-field/FormField.tsx`

```tsx
import type { InputHTMLAttributes } from 'react';

import { Input } from '@/shared/ui/input';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  inputClassName?: string;
}

export function FormField({ label, error, inputClassName, id, ...props }: FormFieldProps) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="text-foreground block text-sm font-medium">
        {label}
      </label>
      <Input id={fieldId} className={inputClassName} {...props} />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

**사용법**

```tsx
import { FormField } from '@/shared/ui/form-field';

<FormField
  label="Email"
  type="email"
  placeholder="Enter your email"
  error={errors.email?.message}
  {...register('email')}
/>;
```

### 컴포넌트 variants 만들기 (cva)

shadcn/ui 컴포넌트는 `class-variance-authority`를 사용하여 variants를 정의합니다.

**예시: Button variants** (src/shared/ui/button.tsx:8-32)

```tsx
import { type VariantProps, cva } from 'class-variance-authority';

const buttonVariants = cva(
  // base styles
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
```

**커스텀 컴포넌트에 variants 적용**

```tsx
import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/shared/lib';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        success: 'bg-success text-success-foreground',
        warning: 'bg-warning text-warning-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```

## 스타일링

### cn() 유틸리티 함수

shadcn/ui는 `cn()` 헬퍼 함수를 사용하여 클래스 이름을 병합합니다.

**위치**: `src/shared/lib/utils.ts`

```tsx
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**사용법**

```tsx
import { cn } from '@/shared/lib';

// 조건부 클래스 병합
<div className={cn(
  'base-class',
  isActive && 'active-class',
  className, // props로 받은 클래스
)} />

// 컴포넌트 variants와 함께
<Button className={cn(buttonVariants({ variant, size }), className)} />
```

## FSD 아키텍처 통합

Feature-Sliced Design(FSD) 아키텍처에서 shadcn/ui 컴포넌트는 **shared layer**에 위치합니다.

### 계층별 사용 규칙

```
app/          ✅ @/shared/ui 사용 가능
  ↓
pages/        ✅ @/shared/ui 사용 가능
  ↓
widgets/      ✅ @/shared/ui 사용 가능
  ↓
features/     ✅ @/shared/ui 사용 가능
  ↓
entities/     ✅ @/shared/ui 사용 가능
  ↓
shared/       ✅ 여기에 shadcn/ui 컴포넌트 위치
```

### Import 경로

**올바른 import** ✅

```tsx
// 모든 레이어에서 사용 가능
import { Button } from '@/shared/ui/button';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
```

**잘못된 import** ❌

```tsx
// 상대 경로 사용 금지
import { Button } from '../../../shared/ui/button';

// shared 외부에서 컴포넌트 만들기 금지
import { Button } from '@/features/ui/button';  // ❌
import { Button } from '@/widgets/ui/button';   // ❌
```

### 컴포넌트 조합 패턴

**Features Layer에서 사용**

```tsx
// features/auth/ui/LoginForm.tsx
import { Button } from '@/shared/ui/button';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';

export function LoginForm() {
  return (
    <form>
      <FormField label="Email" type="email" />
      <FormField label="Password" type="password" />
      <Button type="submit">Login</Button>
    </form>
  );
}
```

**Widgets Layer에서 조합**

```tsx
// widgets/profile-header/ui/ProfileHeader.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';

export function ProfileHeader({ profile }) {
  return (
    <div>
      <Avatar>
        <AvatarImage src={profile.image} />
        <AvatarFallback>{profile.name[0]}</AvatarFallback>
      </Avatar>
      <Button>Follow</Button>
    </div>
  );
}
```

### 새 컴포넌트 만들 때 위치 결정

| 컴포넌트 타입                      | 위치                     | 예시                      |
| ---------------------------------- | ------------------------ | ------------------------- |
| shadcn/ui 기본 컴포넌트            | `shared/ui/`             | button.tsx, input.tsx     |
| 재사용 가능한 UI 컴포넌트          | `shared/ui/`             | form-field, loading-state |
| 비즈니스 로직 포함 컴포넌트        | `features/[feature]/ui/` | LoginForm, PostForm       |
| 복잡한 UI 블록 (여러 feature 조합) | `widgets/[widget]/ui/`   | ProfileHeader, FeedList   |
| 페이지 전용 컴포넌트               | `pages/[page]/`          | HomePage, ProfilePage     |

## 베스트 프랙티스

### 1. 컴포넌트 커스터마이징

shadcn/ui 컴포넌트는 직접 수정 가능합니다. 필요에 따라 소스 코드를 변경하세요.

```tsx
// ✅ Good: 필요시 컴포넌트 파일을 직접 수정
// src/shared/ui/button.tsx
const buttonVariants = cva('base-styles...', {
  variants: {
    variant: {
      // 새로운 variant 추가
      brand: 'bg-[#6FCA3C] text-white hover:bg-[#5CB32A]',
    },
  },
});
```

### 2. className prop 활용

항상 `className` prop을 남겨두어 외부에서 스타일 확장이 가능하도록 하세요.

```tsx
// ✅ Good
export function MyComponent({ className, ...props }: Props) {
  return (
    <div className={cn('base-styles', className)} {...props} />
  );
}

// ❌ Bad: className 확장 불가
export function MyComponent(props: Props) {
  return <div className="base-styles" {...props} />;
}
```

### 3. 컴포넌트 조합 선호

복잡한 컴포넌트를 만들기보다 작은 컴포넌트를 조합하세요.

```tsx
// ✅ Good: 조합
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>

// ❌ Bad: 단일 거대 컴포넌트
<ComplexCard title="Title" content="Content" footer="Footer" showHeader={true} />
```

### 4. 타입 안전성 유지

컴포넌트에 적절한 타입을 지정하세요.

```tsx
interface MyComponentProps {
  title: string;
  variant?: 'default' | 'success' | 'error';
  onClick?: () => void;
}

export function MyComponent({ title, variant = 'default', onClick }: MyComponentProps) {
  // ...
}
```

### 5. Accessibility 고려

shadcn/ui는 Radix UI 기반으로 접근성이 좋지만, 커스텀 컴포넌트를 만들 때도 접근성을 고려하세요.

```tsx
// ✅ Good: 접근성 고려
<button
  aria-label="Close menu"
  aria-pressed={isOpen}
  onClick={handleClick}
>
  <IconClose />
</button>

// ❌ Bad: 접근성 부족
<div onClick={handleClick}>
  <IconClose />
</div>
```

### 6. 일관된 스타일링

프로젝트 전체에서 일관된 spacing, sizing, color를 사용하세요.

```tsx
// ✅ Good: Tailwind 클래스 사용
<div className="space-y-4 p-4">
  <div className="h-10 w-full" />
</div>

// ❌ Bad: 하드코딩된 값
<div style={{ marginTop: '16px', padding: '16px' }}>
  <div style={{ height: '40px', width: '100%' }} />
</div>
```

### 7. 성능 최적화

필요한 컴포넌트만 import하세요.

```tsx
// ✅ Good: 필요한 것만 import
// ❌ Bad: barrel export로 모두 import
import * as UI from '@/shared/ui';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

// 모든 컴포넌트 로드
```

### 8. 문서화

복잡한 컴포넌트는 주석이나 JSDoc으로 문서화하세요.

````tsx
/**
 * FormField는 레이블, 입력 필드, 에러 메시지를 포함하는 폼 필드 컴포넌트입니다.
 *
 * @example
 * ```tsx
 * <FormField
 *   label="Email"
 *   type="email"
 *   error={errors.email?.message}
 *   {...register('email')}
 * />
 * ```
 */
export function FormField({ label, error, ...props }: FormFieldProps) {
  // ...
}
````

## 참고 자료

- [shadcn/ui 공식 문서](https://ui.shadcn.com)
- [Radix UI 문서](https://www.radix-ui.com)
- [Tailwind CSS v4 문서](https://tailwindcss.com)
- [class-variance-authority](https://cva.style/docs)
- [프로젝트 CLAUDE.md](./CLAUDE.md) - 전체 프로젝트 가이드

## 추가 도움말

문제가 발생하거나 질문이 있으면:

1. `components.json` 설정 확인
2. Tailwind CSS가 올바르게 설정되어 있는지 확인
3. shadcn/ui 공식 문서 참조
4. 프로젝트의 기존 컴포넌트 사용 예시 참조
