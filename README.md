# barleyssal-frontend

React + Vite + TypeScript 모의주식투자 프론트엔드

## 요구사항

- Node.js 18+
- Spring Boot 백엔드: `http://localhost:8080`
- Node.js Market Gateway: `http://localhost:4000`

## 실행

```bash
npm install
npm run dev
# → http://localhost:5173
```

## 페이지 구조

| 경로 | 설명 |
|------|------|
| `/login` | 로그인 |
| `/signup` | 회원가입 |
| `/` | 메인 (관심종목 / 전체종목) |
| `/stocks/:code` | 종목 상세 + 차트 + 매수/매도 |
| `/account` | 내 계좌 (실시간 손익) |
| `/profile` | 마이페이지 |

## 환경설정

`vite.config.ts`의 proxy 설정:
- `/api/v1/*` → Spring Boot (8080)
- `/api/market/*` → Node.js Gateway (4000)

WebSocket: `ws://localhost:4000/ws` (하드코딩, 배포 시 수정 필요)

## 주요 기능

- WebSocket 실시간 가격 수신 (자동 재연결)
- 실시간 PnL 계산 (Node.js WS push)
- 관심종목 로컬 저장 (zustand persist)
- 원금 설정 시 보유종목 초기화 안내
- 매수/매도 드로어 (시장가/지정가)
