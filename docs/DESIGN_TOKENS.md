# 디자인 토큰

POS 앱 특성(정보밀도↑)을 반영해 **5단계** 스케일로 통일. Tailwind v4 `@theme` 와 PrimeVue preset이 동일 값을 공유.

## 텍스트 스케일

Tailwind 기본값을 POS 기준으로 **override**.

| 토큰          | 값        | px | 용도                                |
| ------------- | --------- | -- | ----------------------------------- |
| `text-xs`     | 0.625rem  | 10 | 캡션, 푸터 보조 ("로그아웃")         |
| `text-sm`     | 0.75rem   | 12 | 작은 본문, 뱃지 숫자, 그룹 헤더      |
| `text-base`   | 0.8125rem | 13 | 리스트/네비 항목 기본 (POS 디폴트)   |
| `text-lg`     | 1rem      | 16 | 강조 본문, 브랜드 로고, 큰 아이콘    |
| `text-xl`     | 1.125rem  | 18 | 섹션 타이틀, 페이지 헤더             |

Figma에 11px가 있으면 `text-sm` (12) 로 반올림. 14px/20px 필요하면 토큰 추가 대신 디자인 재검토.

## 스페이싱 / 사이즈 / 라운드

Tailwind v4 **기본값 그대로 사용**. Figma 값이 모두 4px 배수로 떨어지고 기본 스케일에 포함됨.

| 용도           | Figma     | Tailwind 클래스     |
| -------------- | --------- | ------------------- |
| 네비 항목 높이 | 44px      | `h-11`              |
| 푸터 높이      | 48px      | `h-12`              |
| 헤더 높이      | 56px      | `h-14`              |
| 토글 버튼 (S)  | 32px      | `size-8`            |
| 토글 버튼 (L)  | 40px      | `size-10`           |
| 네비 rounded   | 8px       | `rounded-lg`        |
| 토글 rounded   | 6px       | `rounded-md`        |
| 카드 rounded   | 12px      | `rounded-xl`        |
| 아바타 rounded | 14px (반지름) | `rounded-full`  |

## 색상

[theme.css](../src/style/theme.css) 의 PrimeVue 브릿지 사용. PrimeVue preset에서 색상 오버라이드 → Tailwind `@theme` 가 자동 반영.

- **브랜드**: `primary-50 ~ 950` (Cheonil 그린 #4FB395)
- **표면**: `surface-0 ~ 950` (Figma 톤, Aura slate 오버라이드)
- **상태**: `status-caution/warning/danger` (15/25/35분 경과)
- **심각도**: `red-*`, `amber-*`, `orange-*`, `blue-*`, `emerald-*` (Aura 기본값)

### Surface 사용 규칙 (Figma 매칭)

| 토큰          | Hex       | 용도                                  |
| ------------- | --------- | ------------------------------------- |
| `surface-0`   | `#ffffff` | 메인 배경, 카드 배경                   |
| `surface-50`  | `#f7fafa` | 미묘한 배경 (푸터, 토글 버튼, hover)   |
| `surface-100` | `#edf2f3` | 2단계 배경                             |
| `surface-200` | `#e0e5eb` | 구분선, 기본 border                    |
| `surface-500` | `#73808c` | muted 텍스트 (그룹 헤더, 캡션, 보조)   |
| `surface-900` | `#212933` | 기본 텍스트                            |

사이드바 예시:
```vue
<!-- Before -->
<span class="text-[#73808c]">영업</span>
<div class="bg-[#f7fafa] border-[#e0e5eb]">...</div>

<!-- After -->
<span class="text-surface-500">영업</span>
<div class="bg-surface-50 border-surface-200">...</div>
```

## PrimeVue 컴포넌트 사이즈

PrimeVue `size` prop 과 텍스트 토큰이 자동 정렬되도록 [preset.ts](../src/style/preset.ts) 에서 오버라이드.

| PrimeVue 설정            | 폰트 크기     | Tailwind 대응 |
| ------------------------ | ------------- | ------------- |
| `<Button size="small">`  | 0.75rem (12)  | `text-sm`     |
| `<Button>` (기본)         | 0.8125rem (13) | `text-base`   |
| `<Button size="large">`  | 1rem (16)     | `text-lg`     |

Input/Select 등 form-field 계열도 동일 규칙.

## 규칙

1. **매직넘버 금지** — `text-[11px]`, `h-[44px]` 같은 임의값 대신 토큰 사용
2. **예외는 문서화** — 부득이 특정 값이 필요하면 주석으로 이유 표기
3. **토큰 추가는 신중하게** — 새 단계 추가 전에 기존 5개로 수용 가능한지 먼저 검토
