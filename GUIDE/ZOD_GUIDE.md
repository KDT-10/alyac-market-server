# Zod 사용 가이드

이 문서는 Alyac Market 프로젝트에서 Zod를 사용하여 런타임 타입 검증과 폼 유효성 검사를 수행하는 방법을 설명합니다.

## 목차

- [Zod란?](#zod란)
- [프로젝트 설정](#프로젝트-설정)
- [기본 사용법](#기본-사용법)
- [스키마 정의](#스키마-정의)
- [React Hook Form 통합](#react-hook-form-통합)
- [검증 규칙](#검증-규칙)
- [타입 추론](#타입-추론)
- [FSD 아키텍처 통합](#fsd-아키텍처-통합)
- [고급 패턴](#고급-패턴)
- [베스트 프랙티스](#베스트-프랙티스)

## Zod란?

Zod는 **TypeScript-first 스키마 선언 및 검증 라이브러리**입니다.

### 주요 특징

- **TypeScript 우선**: TypeScript와 완벽하게 통합되어 타입 안전성 제공
- **런타임 검증**: 컴파일 타임뿐만 아니라 런타임에도 데이터 유효성 검사
- **타입 추론**: 스키마에서 TypeScript 타입 자동 생성
- **제로 의존성**: 외부 라이브러리 의존성 없음
- **체이닝 API**: 직관적이고 읽기 쉬운 API
- **React Hook Form 통합**: `@hookform/resolvers/zod`를 통한 seamless 통합

### Zod의 역할

프로젝트에서 Zod는 다음 역할을 수행합니다:

1. **폼 유효성 검사** - 사용자 입력 데이터 검증
2. **타입 안전성** - 런타임과 컴파일 타임 타입 일치 보장
3. **에러 메시지** - 사용자 친화적인 에러 메시지 제공
4. **데이터 파싱** - API 응답, 환경 변수 등의 데이터 검증 및 파싱

## 프로젝트 설정

### 패키지 설치

```bash
# Zod 설치
npm install zod

# React Hook Form과 함께 사용하기 위한 resolver 설치
npm install @hookform/resolvers
```

**현재 프로젝트 버전**:

```json
{
  "dependencies": {
    "zod": "^4.2.0",
    "@hookform/resolvers": "^5.2.2",
    "react-hook-form": "^7.68.0"
  }
}
```

### Import 방법

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
```

## 기본 사용법

### 스키마 정의

```typescript
import { z } from 'zod';

// 기본 스키마
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});

// 데이터 검증
const result = userSchema.safeParse({
  name: 'John',
  age: 30,
  email: 'john@example.com',
});

if (result.success) {
  console.log(result.data); // { name: 'John', age: 30, email: 'john@example.com' }
} else {
  console.log(result.error); // ZodError with validation issues
}
```

### 타입 추론

```typescript
// 스키마에서 TypeScript 타입 자동 생성
type User = z.infer<typeof userSchema>;
// type User = { name: string; age: number; email: string; }
```

## 스키마 정의

스키마 사용 예시들입니다.

### 인증 폼 스키마

**위치**: `src/features/auth/model/schemas.ts`

```typescript
import { z } from 'zod';

// 회원가입 스키마
export const signUpSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
});

// 로그인 스키마
export const signInSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

// 타입 추론
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
```

**주요 포인트**:

- `z.string().email()` - 이메일 형식 검증
- `z.string().min()` - 최소 길이 검증
- 커스텀 에러 메시지 제공

### 게시글 폼 스키마

**위치**: `src/features/post-form/model/schemas.ts`

```typescript
import { z } from 'zod';

export const postFormSchema = z.object({
  content: z
    .string()
    .min(1, '게시글 내용을 입력해주세요.')
    .max(2200, '게시글은 최대 2200자까지 입력 가능합니다.'),
});

export type PostFormData = z.infer<typeof postFormSchema>;
```

**주요 포인트**:

- 체이닝을 통한 여러 검증 규칙 적용
- `.min()`과 `.max()`로 길이 제한

### 프로필 폼 스키마

**위치**: `src/features/profile/model/schemas.ts`

```typescript
import { z } from 'zod';

export const profileSchema = z.object({
  username: z.string().min(1, '사용자 이름을 입력해주세요.'),
  accountId: z
    .string()
    .min(1, '계정 ID를 입력해주세요.')
    .regex(/^[a-zA-Z0-9_.]+$/, '영문, 숫자, 밑줄(_), 마침표(.)만 사용할 수 있습니다.'),
  bio: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
```

**주요 포인트**:

- `.regex()` - 정규식 검증
- `.optional()` - 선택적 필드

## React Hook Form 통합

Zod는 React Hook Form과 완벽하게 통합됩니다.

### 기본 통합 패턴

**위치**: `src/features/auth/ui/SignInForm.tsx`

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { type SignInFormData, signInSchema } from '../model/schemas';

const {
  control,
  handleSubmit,
  formState: { errors, isValid },
} = useForm<SignInFormData>({
  resolver: zodResolver(signInSchema), // Zod 스키마를 resolver로 사용
  mode: 'onChange', // 변경 시마다 검증
  defaultValues: {
    email: '',
    password: '',
  },
});
```

### 폼 제출 핸들러

```typescript
const onSubmit = (data: SignInFormData) => {
  // data는 이미 Zod 스키마를 통과한 유효한 데이터
  console.log(data); // { email: string, password: string }
  signInMutation.mutate(data);
};

// JSX
<form onSubmit={handleSubmit(onSubmit)}>
  {/* 폼 필드들 */}
</form>
```

### Controller와 에러 표시

**위치**: `src/features/auth/ui/SignInForm.tsx`

```typescript
import { Controller } from 'react-hook-form';
import { FormField } from '@/shared/ui';

<Controller
  name="email"
  control={control}
  render={({ field }) => (
    <FormField
      label="이메일"
      type="email"
      placeholder="이메일을 입력하세요."
      error={errors.email?.message} // Zod 에러 메시지
      {...field}
    />
  )}
/>
```

### 동적 에러 설정

**위치**: `src/features/auth/ui/SignUpForm.tsx`

```typescript
const { setError } = useForm<SignUpFormData>({
  resolver: zodResolver(signUpSchema),
});

// API 응답에 따라 동적으로 에러 설정
validateEmailMutation.mutate(data, {
  onSuccess: (response) => {
    if (!response.ok) {
      setError('email', { message: response.message });
    }
  },
});
```

## 검증 규칙

Zod가 제공하는 다양한 검증 규칙들입니다.

### 문자열 검증

```typescript
const stringSchema = z.object({
  // 기본 문자열
  name: z.string(),

  // 최소 길이
  password: z.string().min(8, '최소 8자'),

  // 최대 길이
  bio: z.string().max(160, '최대 160자'),

  // 최소/최대 길이
  content: z.string().min(1).max(2200),

  // 이메일
  email: z.string().email('올바른 이메일 형식'),

  // URL
  website: z.string().url('올바른 URL 형식'),

  // 정규식
  username: z.string().regex(/^[a-zA-Z0-9_]+$/, '영문, 숫자, 밑줄만 가능'),

  // 선택적 필드
  nickname: z.string().optional(),

  // 기본값 제공
  role: z.string().default('user'),

  // 빈 문자열 허용 안 함
  required: z.string().min(1, '필수 입력'),

  // 대소문자 변환
  lowercase: z.string().toLowerCase(),
  uppercase: z.string().toUpperCase(),

  // 공백 제거
  trimmed: z.string().trim(),
});
```

### 숫자 검증

```typescript
const numberSchema = z.object({
  // 기본 숫자
  age: z.number(),

  // 최소값
  minAge: z.number().min(18, '18세 이상'),

  // 최대값
  maxAge: z.number().max(100, '100세 이하'),

  // 범위
  score: z.number().min(0).max(100),

  // 양수
  positive: z.number().positive('양수만 가능'),

  // 음수
  negative: z.number().negative(),

  // 정수
  integer: z.number().int('정수만 가능'),

  // 유한수
  finite: z.number().finite(),
});
```

### 불리언 검증

```typescript
const booleanSchema = z.object({
  isActive: z.boolean(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: '이용약관에 동의해주세요.',
  }),
});
```

### 날짜 검증

```typescript
const dateSchema = z.object({
  // 기본 날짜
  birthday: z.date(),

  // 최소 날짜
  startDate: z.date().min(new Date('2020-01-01'), '2020년 1월 1일 이후'),

  // 최대 날짜
  endDate: z.date().max(new Date(), '미래 날짜 불가'),

  // 문자열을 날짜로 변환
  dateString: z.string().pipe(z.coerce.date()),
});
```

### 배열 검증

```typescript
const arraySchema = z.object({
  // 문자열 배열
  tags: z.array(z.string()),

  // 최소 길이
  items: z.array(z.string()).min(1, '최소 1개 이상'),

  // 최대 길이
  images: z.array(z.string()).max(5, '최대 5개'),

  // 범위
  numbers: z.array(z.number()).min(1).max(10),

  // 비어있지 않음
  nonEmpty: z.array(z.string()).nonempty('최소 1개 필요'),
});
```

### 객체 검증

```typescript
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string(),
});

const userSchema = z.object({
  name: z.string(),
  address: addressSchema, // 중첩 객체
  contacts: z.array(addressSchema), // 객체 배열
});
```

### enum 검증

```typescript
const roleSchema = z.enum(['admin', 'user', 'guest']);

const userSchema = z.object({
  role: roleSchema,
  status: z.enum(['active', 'inactive', 'pending']),
});

type Role = z.infer<typeof roleSchema>; // 'admin' | 'user' | 'guest'
```

### Union (여러 타입 중 하나)

```typescript
const valueSchema = z.union([z.string(), z.number()]);

const responseSchema = z.object({
  data: z.union([
    z.object({ type: z.literal('success'), message: z.string() }),
    z.object({ type: z.literal('error'), error: z.string() }),
  ]),
});
```

### Nullable과 Optional

```typescript
const schema = z.object({
  // undefined 허용
  optional: z.string().optional(),

  // null 허용
  nullable: z.string().nullable(),

  // null과 undefined 모두 허용
  nullish: z.string().nullish(),

  // 기본값과 함께
  withDefault: z.string().optional().default('default value'),
});
```

## 타입 추론

Zod의 강력한 기능 중 하나는 스키마에서 TypeScript 타입을 자동으로 추론하는 것입니다.

### 기본 타입 추론

```typescript
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
  bio: z.string().optional(),
});

// 타입 추론
type User = z.infer<typeof userSchema>;
/*
type User = {
  name: string;
  age: number;
  email: string;
  role: 'admin' | 'user';
  bio?: string | undefined;
}
*/
```

### Input vs Output 타입

```typescript
const transformSchema = z.object({
  age: z.string().pipe(z.coerce.number()), // string을 number로 변환
  name: z.string().transform((val) => val.toUpperCase()),
});

type Input = z.input<typeof transformSchema>;
// { age: string; name: string; }

type Output = z.output<typeof transformSchema>;
// { age: number; name: string; }

// z.infer는 output 타입과 동일
type Inferred = z.infer<typeof transformSchema>;
// { age: number; name: string; }
```

### 실제 프로젝트 예시

```typescript
// 스키마 정의
export const signUpSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
});

// 타입 추론 - API 요청/응답, 컴포넌트 props 등에서 재사용
export type SignUpFormData = z.infer<typeof signUpSchema>;

// React Hook Form에서 사용
const form = useForm<SignUpFormData>({
  resolver: zodResolver(signUpSchema),
});

// API 함수에서 사용
async function signUp(data: SignUpFormData) {
  return api.post('/auth/signup', data);
}
```

## FSD 아키텍처 통합

Feature-Sliced Design 아키텍처에서 Zod 스키마의 위치와 사용 방법입니다.

### 스키마 위치 규칙

```
프로젝트/
├── src/
│   ├── features/              # Features layer
│   │   ├── auth/
│   │   │   ├── model/
│   │   │   │   └── schemas.ts # ✅ 폼 검증 스키마
│   │   │   └── ui/            # 폼 컴포넌트에서 사용
│   │   ├── post-form/
│   │   │   ├── model/
│   │   │   │   └── schemas.ts # ✅ 게시글 폼 스키마
│   │   │   └── ui/
│   │   └── profile/
│   │       ├── model/
│   │       │   └── schemas.ts # ✅ 프로필 폼 스키마
│   │       └── ui/
│   └── entities/              # Entities layer
│       └── user/
│           └── model/
│               └── types.ts   # ✅ API 응답 검증 스키마 (선택적)
```

### 계층별 사용 규칙

| Layer    | 위치                            | 용도                               |
| -------- | ------------------------------- | ---------------------------------- |
| features | `features/[feature]/model/`     | 폼 검증 스키마 (주 사용처)         |
| entities | `entities/[entity]/model/`      | API 응답 검증 스키마 (필요시)      |
| shared   | `shared/lib/` (거의 사용 안 함) | 공통 검증 유틸리티 (예: 이메일 등) |

### Import 패턴

```typescript
// ✅ Good: 같은 feature 내에서 import
// features/auth/ui/SignInForm.tsx
import { signInSchema, type SignInFormData } from '../model/schemas';

// ✅ Good: entity에서 API 검증 스키마 사용
// entities/user/api/signUp.ts
import { signUpResponseSchema } from '../model/schemas';

// ❌ Bad: feature 간 스키마 직접 import
import { signInSchema } from '@/features/auth/model/schemas'; // 다른 feature에서
```

### 파일 구조 예시

**features/auth/model/schemas.ts**:

```typescript
import { z } from 'zod';

// 회원가입 스키마
export const signUpSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
});

// 로그인 스키마
export const signInSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

// 타입 추론
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
```

**features/auth/ui/SignInForm.tsx**:

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// 같은 feature의 model에서 import
import { type SignInFormData, signInSchema } from '../model/schemas';

export function SignInForm() {
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  // ...
}
```

## 고급 패턴

### 조건부 검증 (refine)

```typescript
const passwordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'], // 에러가 표시될 필드
  });
```

### 복잡한 검증 로직 (superRefine)

```typescript
const registrationSchema = z
  .object({
    age: z.number(),
    parentalConsent: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.age < 18 && !data.parentalConsent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '미성년자는 보호자 동의가 필요합니다.',
        path: ['parentalConsent'],
      });
    }
  });
```

### 스키마 재사용 및 확장

```typescript
// 기본 스키마
const baseUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// 확장
const signUpSchema = baseUserSchema.extend({
  username: z.string().min(3),
  agreeToTerms: z.boolean(),
});

// 일부 필드 선택
const loginSchema = baseUserSchema.pick({ email: true, password: true });

// 일부 필드 제외
const publicUserSchema = baseUserSchema.omit({ password: true });

// 모든 필드 optional로 변경
const partialUserSchema = baseUserSchema.partial();

// 일부 필드만 optional로
const optionalEmailSchema = baseUserSchema.extend({
  email: baseUserSchema.shape.email.optional(),
});
```

### Transform (데이터 변환)

```typescript
const formSchema = z.object({
  // 문자열을 숫자로 변환
  age: z.string().transform((val) => parseInt(val, 10)),

  // 공백 제거
  name: z.string().transform((val) => val.trim()),

  // 대문자 변환
  code: z.string().transform((val) => val.toUpperCase()),

  // 배열 문자열을 배열로 변환
  tags: z.string().transform((val) => val.split(',').map((tag) => tag.trim())),
});
```

### Preprocess (전처리)

```typescript
const preprocessSchema = z.preprocess(
  (val) => {
    // undefined를 빈 문자열로 변환
    if (val === undefined) return '';
    return val;
  },
  z.string().min(1, '필수 입력'),
);

const dateSchema = z.preprocess((arg) => {
  if (typeof arg === 'string' || arg instanceof Date) {
    return new Date(arg);
  }
}, z.date());
```

### Discriminated Unions

```typescript
const responseSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    data: z.object({
      id: z.string(),
      name: z.string(),
    }),
  }),
  z.object({
    status: z.literal('error'),
    error: z.object({
      code: z.number(),
      message: z.string(),
    }),
  }),
]);
```

### API 응답 검증

```typescript
// API 응답 스키마
const userResponseSchema = z.object({
  user: z.object({
    _id: z.string(),
    username: z.string(),
    email: z.string().email(),
    accountname: z.string(),
  }),
  token: z.string(),
});

// API 함수에서 사용
async function signUp(data: SignUpFormData) {
  const response = await api.post('/auth/signup', data);

  // 응답 검증
  const validatedResponse = userResponseSchema.parse(response.data);

  return validatedResponse;
}

// 또는 안전한 파싱
async function signUpSafe(data: SignUpFormData) {
  const response = await api.post('/auth/signup', data);

  const result = userResponseSchema.safeParse(response.data);

  if (!result.success) {
    console.error('Invalid API response:', result.error);
    throw new Error('Invalid response format');
  }

  return result.data;
}
```

## 베스트 프랙티스

### 1. 명확한 에러 메시지

사용자 친화적인 에러 메시지를 제공하세요.

```typescript
// ✅ Good: 명확한 에러 메시지
const schema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
});

// ❌ Bad: 기본 에러 메시지
const schema = z.object({
  email: z.string().email(), // "Invalid email"
  password: z.string().min(8), // "String must contain at least 8 character(s)"
});
```

### 2. 스키마와 타입을 함께 export

```typescript
// ✅ Good: 스키마와 타입을 함께 export
export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type SignUpFormData = z.infer<typeof signUpSchema>;

// ❌ Bad: 스키마만 export
export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
// 다른 파일에서 타입 추론 반복
```

### 3. 스키마 재사용

공통 검증 로직은 재사용하세요.

```typescript
// ✅ Good: 공통 스키마 정의
const emailSchema = z.string().email('올바른 이메일 형식을 입력해주세요.');
const passwordSchema = z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.');

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});
```

### 4. 비즈니스 로직 분리

복잡한 검증 로직은 `refine`이나 `superRefine`으로 분리하세요.

```typescript
// ✅ Good: 비즈니스 로직 분리
const passwordMatchSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

// ❌ Bad: 검증 로직을 컴포넌트에서 처리
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
});
// 컴포넌트에서 일치 여부 확인...
```

### 5. safeParse vs parse

에러 처리가 필요한 경우 `safeParse`를 사용하세요.

```typescript
// ✅ Good: 에러 처리
const result = schema.safeParse(data);
if (!result.success) {
  console.error(result.error);
  return;
}
const validData = result.data;

// ⚠️ Caution: 에러가 throw됨
try {
  const validData = schema.parse(data);
} catch (error) {
  console.error(error);
}
```

### 6. 스키마 문서화

복잡한 스키마는 주석으로 문서화하세요.

```typescript
/**
 * 프로필 업데이트 스키마
 *
 * @property username - 사용자 이름 (필수, 1자 이상)
 * @property accountId - 계정 ID (필수, 영문/숫자/밑줄/마침표만 허용)
 * @property bio - 자기소개 (선택)
 */
export const profileSchema = z.object({
  username: z.string().min(1, '사용자 이름을 입력해주세요.'),
  accountId: z
    .string()
    .min(1, '계정 ID를 입력해주세요.')
    .regex(/^[a-zA-Z0-9_.]+$/, '영문, 숫자, 밑줄(_), 마침표(.)만 사용할 수 있습니다.'),
  bio: z.string().optional(),
});
```

### 7. 타입 안전성 유지

`z.infer`로 추론된 타입을 사용하여 타입 안전성을 유지하세요.

```typescript
// ✅ Good: 타입 추론 사용
export const userSchema = z.object({
  name: z.string(),
  age: z.number(),
});
export type User = z.infer<typeof userSchema>;

function processUser(user: User) {
  // 타입 안전
}

// ❌ Bad: 수동 타입 정의
export const userSchema = z.object({
  name: z.string(),
  age: z.number(),
});
export type User = { name: string; age: number }; // 스키마와 불일치 가능성
```

### 8. 성능 최적화

스키마는 컴포넌트 외부에 정의하세요.

```typescript
// ✅ Good: 컴포넌트 외부에 정의
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });
}

// ❌ Bad: 컴포넌트 내부에 정의 (매 렌더링마다 재생성)
export function LoginForm() {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  const form = useForm({
    resolver: zodResolver(schema),
  });
}
```

## 참고 자료

- [Zod 공식 문서](https://zod.dev)
- [React Hook Form 문서](https://react-hook-form.com)
- [@hookform/resolvers 문서](https://github.com/react-hook-form/resolvers)
- [프로젝트 CLAUDE.md](./CLAUDE.md) - 전체 프로젝트 가이드

## 추가 도움말

문제가 발생하거나 질문이 있으면:

1. 프로젝트의 기존 스키마 파일 참조 (`src/features/*/model/schemas.ts`)
2. Zod 공식 문서의 에러 메시지 확인
3. React Hook Form과의 통합 이슈는 `@hookform/resolvers` 문서 참조
