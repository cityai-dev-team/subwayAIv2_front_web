# 운영 환경 CORS 설정 가이드

운영 환경에서 프론트엔드와 백엔드가 다른 서버에서 실행될 때 CORS 설정 방법입니다.

## 현재 상황

- **프론트엔드**: `http://localhost:3001` (또는 다른 서버)
- **백엔드**: `http://10.121.171.21:8001` (다른 서버)
- **문제**: CORS 정책으로 인해 직접 연결 불가

## 해결 방법

### 1. 백엔드 API 서버 CORS 설정 (필수)

백엔드 서버(`10.121.171.21:8001`)의 CORS 설정에 프론트엔드 주소를 추가해야 합니다.

**`subwayAIv2_api_web/.env.prod` 파일 수정:**

```bash
cd ../subwayAIv2_api_web
nano .env.prod
```

**CORS 설정 추가:**
```bash
# 프론트엔드가 localhost:3001에서 실행되는 경우
CORS_ORIGINS=http://localhost:3001

# 프론트엔드가 다른 서버에서 실행되는 경우 (예: 10.121.171.20:3001)
CORS_ORIGINS=http://10.121.171.20:3001

# 여러 주소 허용 (콤마로 구분)
CORS_ORIGINS=http://localhost:3001,http://10.121.171.20:3001

# 도메인을 사용하는 경우
CORS_ORIGINS=https://dashboard.example.com
```

**백엔드 컨테이너 재시작:**
```bash
cd subwayAIv2_api_web
./scripts/run-prod.sh restart
```

### 2. 프론트엔드 API 주소 설정

프론트엔드에서 실제 백엔드 서버 주소를 설정합니다.

**`subwayAIv2_front_web/.env.prod` 파일 수정:**

```bash
cd subwayAIv2_front_web
nano .env.prod
```

**API 주소 설정:**
```bash
# 실제 백엔드 서버 주소로 변경
VITE_API_BASE=http://10.121.171.21:8001

# 또는 도메인을 사용하는 경우
# VITE_API_BASE=https://api.example.com
```

**프론트엔드 재빌드:**
```bash
./scripts/run-prod.sh build
```

## 설정 예시

### 시나리오 1: 프론트엔드와 백엔드가 같은 서버의 다른 포트

**백엔드 `.env.prod`:**
```bash
CORS_ORIGINS=http://localhost:3001
```

**프론트엔드 `.env.prod`:**
```bash
VITE_API_BASE=http://localhost:8001
```

### 시나리오 2: 프론트엔드와 백엔드가 다른 서버

**백엔드 서버 (10.121.171.21) `.env.prod`:**
```bash
# 프론트엔드 서버 주소 추가
CORS_ORIGINS=http://10.121.171.20:3001
# 또는 프론트엔드가 localhost에서 접근하는 경우
CORS_ORIGINS=http://localhost:3001
```

**프론트엔드 서버 `.env.prod`:**
```bash
# 백엔드 서버 주소
VITE_API_BASE=http://10.121.171.21:8001
```

### 시나리오 3: 도메인 사용

**백엔드 `.env.prod`:**
```bash
CORS_ORIGINS=https://dashboard.example.com
```

**프론트엔드 `.env.prod`:**
```bash
VITE_API_BASE=https://api.example.com
```

## 확인 방법

### 1. 백엔드 CORS 설정 확인

```bash
# 백엔드 서버에서
curl -H "Origin: http://localhost:3001" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://10.121.171.21:8001/api/healthz -v
```

응답에 `Access-Control-Allow-Origin: http://localhost:3001`이 포함되어야 합니다.

### 2. 프론트엔드에서 테스트

브라우저 개발자 도구의 Network 탭에서:
- 요청이 성공하는지 확인
- CORS 에러가 사라졌는지 확인

## 주의사항

1. **보안**: 운영 환경에서는 가능한 한 구체적인 도메인/IP를 지정하세요
2. **재시작**: CORS 설정 변경 후 백엔드 컨테이너를 재시작해야 합니다
3. **프론트엔드 재빌드**: VITE_API_BASE 변경 후 프론트엔드를 재빌드해야 합니다

## 빠른 설정

```bash
# 1. 백엔드 CORS 설정
cd subwayAIv2_api_web
echo "CORS_ORIGINS=http://localhost:3001" >> .env.prod
./scripts/run-prod.sh restart

# 2. 프론트엔드 API 주소 설정
cd ../subwayAIv2_front_web
# .env.prod 파일에서 VITE_API_BASE를 실제 백엔드 주소로 수정
nano .env.prod
./scripts/run-prod.sh build
```

