# SubwayAI v2 Front Web

서울교통공사 도시철도 혼잡도 안전관리체계 구축 - 관리 대시보드 프론트엔드

## 📋 개요

SubwayAI v2 관리 대시보드는 혼잡도 모니터링, 통계 분석, 알림 관리 등을 위한 웹 인터페이스를 제공합니다.

## 🚀 빠른 시작

### 환경 요구사항

- Node.js 18+ 
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install

# 또는
yarn install
```

### 환경 변수 설정

#### 개발 환경

```bash
# 개발 환경 변수 파일 생성
cp env.dev.example .env.dev
nano .env.dev  # 실제 값으로 수정
```

#### 운영 환경

```bash
# 운영 환경 변수 파일 생성
cp env.prod.example .env.prod
nano .env.prod  # 실제 값으로 수정
```

환경 변수 예시:
```env
# Infra / Naming
PROJECT=subwayAIv2
NET=subwayAIv2_net
C_WEB=subwayaiv2-front-web-dev  # 또는 -prod
APP_PORT=3001

# API Server
VITE_API_BASE=http://subwayaiv2-api-web-dev:8001  # 개발: Docker 네트워크 내부
# VITE_API_BASE=http://localhost:8001  # 또는 호스트 접근
VITE_API_PREFIX=/api

# App Settings
VITE_APP_TITLE=SubwayAI v2 관리 대시보드
VITE_APP_VERSION=1.0.0
```

### Docker를 사용한 실행

#### 개발 환경 (Vite Dev Server)

**Makefile 사용:**
```bash
# 개발 환경 컨테이너 기동
make dev-up

# 개발 환경 로그 확인
make dev-logs

# 개발 환경 컨테이너 중지
make dev-down
```

**스크립트 사용:**
```bash
# 개발 환경 시작 (대화형 메뉴)
./scripts/run-dev.sh

# 또는 직접 명령어 실행
./scripts/run-dev.sh start    # 서비스 시작
./scripts/run-dev.sh stop     # 서비스 중지
./scripts/run-dev.sh restart # 서비스 재시작
./scripts/run-dev.sh status   # 상태 확인
./scripts/run-dev.sh logs     # 로그 확인
./scripts/run-dev.sh down     # 컨테이너 제거
```

개발 서버는 `http://localhost:3001`에서 실행됩니다.

#### 운영 환경 (Nginx)

**Makefile 사용:**
```bash
# 운영 환경 컨테이너 기동
make prod-up

# 운영 환경 로그 확인
make prod-logs

# 운영 환경 컨테이너 중지
make prod-down
```

**스크립트 사용:**
```bash
# 운영 환경 시작 (대화형 메뉴)
./scripts/run-prod.sh

# 또는 직접 명령어 실행
./scripts/run-prod.sh start    # 서비스 시작
./scripts/run-prod.sh build    # 이미지 빌드 후 시작
./scripts/run-prod.sh stop     # 서비스 중지
./scripts/run-prod.sh restart  # 서비스 재시작
./scripts/run-prod.sh status   # 상태 확인
./scripts/run-prod.sh logs     # 로그 확인
./scripts/run-prod.sh down     # 컨테이너 제거
```

### 로컬 개발 (Docker 없이)

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

**포트**: 개발/운영 모두 3001 포트 사용

## 🔧 설정

### API 서버 연결

프로젝트는 `api_web` 서버(포트 8001)와 통신합니다.

- 개발 환경: `http://localhost:8001`
- 프로덕션: 환경 변수로 설정

### 인증

현재 버전에서는 인증이 비활성화되어 있습니다. 모든 사용자는 자동으로 관리자 권한으로 접근합니다.

## 📁 프로젝트 구조

```
src/
├── components/      # 공통 컴포넌트
│   ├── layout/     # 레이아웃 컴포넌트
│   ├── ui/         # UI 컴포넌트
│   └── ...
├── modules/        # 기능 모듈
│   ├── dashboard/  # 대시보드
│   ├── auth/       # 인증 (비활성화)
│   └── ...
├── lib/            # 유틸리티
│   └── api.ts      # API 클라이언트
├── shared/         # 공유 설정
└── routes.tsx      # 라우팅 설정
```

## 📚 API 엔드포인트

프로젝트는 `api_web`의 다음 엔드포인트를 사용합니다:

- `GET /api/report/getDashboardData` - 대시보드 데이터 (V1)
- `GET /api/report/v2/getDashboardData` - 대시보드 데이터 (V2)
- `GET /api/report/getHourGraphData` - 시간별 그래프 데이터
- `GET /api/report/v2/getHourGraphData` - 시간별 그래프 데이터 (V2)
- 기타 통계 및 리포트 API

자세한 내용은 `api_web` 문서를 참조하세요.

## 🎨 화면 설계

화면 설계는 `docs/project_plan` 파일을 참조하세요.

주요 화면:
- 대시보드 메인 (`/dashboard`)
- CCTV 모니터링 (`/cctv`)
- 통계 분석 (`/statistics`)
- 알림 관리 (`/alerts`)
- 시스템 설정 (`/settings`)

## 🛠️ 개발

### Makefile 명령어

```bash
# 개발 환경
make dev-up          # 개발 환경 컨테이너 기동
make dev-down        # 개발 환경 컨테이너 중지
make dev-restart     # 개발 환경 컨테이너 재시작
make dev-logs        # 개발 환경 로그 확인
make dev-ps          # 개발 환경 컨테이너 상태 확인

# 운영 환경
make prod-up         # 운영 환경 컨테이너 기동
make prod-down       # 운영 환경 컨테이너 중지
make prod-restart    # 운영 환경 컨테이너 재시작
make prod-logs       # 운영 환경 로그 확인
make prod-ps         # 운영 환경 컨테이너 상태 확인

# 공통
make net-create      # 도커 네트워크 생성
make env-print       # 환경 변수 출력
make build           # 프로덕션 빌드 (도커 외부)
make preview         # 빌드 결과 미리보기
```

### 스크립트 사용법

프로젝트에는 `run-dev.sh`와 `run-prod.sh` 스크립트가 포함되어 있어 더 편리하게 서비스를 관리할 수 있습니다.

**개발 환경 스크립트:**
- 대화형 메뉴 제공
- Docker 설치 및 실행 상태 자동 확인
- 네트워크 자동 생성
- 서비스 상태 및 헬스 체크 확인

**운영 환경 스크립트:**
- 대화형 메뉴 제공
- 이미지 빌드 옵션 포함
- Docker 설치 및 실행 상태 자동 확인
- 네트워크 자동 생성
- 서비스 상태 및 헬스 체크 확인

스크립트 실행 권한이 없는 경우:
```bash
chmod +x scripts/run-dev.sh scripts/run-prod.sh
```

### npm 스크립트

```bash
# 개발 서버 (로컬)
npm run dev

# 빌드
npm run build

# 타입 체크
npm run type-check

# 린트
npm run lint

# 포맷
npm run format

# 테스트
npm run test
```

## 📝 참고 문서

- [화면 설계서](./docs/project_plan)
- [API 문서](../subwayAIv2_api_web/README.md)

## 🔗 관련 프로젝트

- `subwayAIv2_api_web` - 백엔드 API 서버 (포트 8001)
- `subwayAIv2_api_dt` - Digital Twin API 서버 (포트 8000)
- `subwayAIv2_api_aggregator` - 데이터 집계 서버 (포트 9091)
