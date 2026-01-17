# CORS 문제 해결 가이드

## 문제 상황
- Swagger는 정상 작동 (같은 origin에서 실행)
- 프론트엔드에서 직접 API 호출 시 CORS 에러 발생
- 에러: `Access to fetch at 'http://10.121.171.21:8001/api/...' from origin 'http://localhost:3001' has been blocked by CORS policy`

## 해결 방법

### 방법 1: Vite Proxy 사용 (권장) ⭐

프론트엔드에서 Vite proxy를 사용하면 CORS 문제가 자동으로 해결됩니다.

**`.env.dev` 파일 수정:**
```bash
# VITE_API_BASE를 비워두거나 주석 처리
VITE_API_BASE=
# 또는
# VITE_API_BASE=http://localhost:8001
```

이렇게 하면:
- 프론트엔드가 `/api`로 요청
- Vite가 자동으로 백엔드로 프록시
- CORS 문제 없음 (같은 origin으로 인식)

**컨테이너 재시작:**
```bash
./scripts/run-dev.sh restart
```

### 방법 2: 백엔드 CORS 설정 수정

백엔드 API 서버의 CORS 설정에 `http://localhost:3001`을 추가합니다.

**`subwayAIv2_api_web/.env.dev` 파일 확인:**
```bash
CORS_ORIGINS=http://localhost:3001
```

**실제 서버가 다른 IP에서 실행 중인 경우:**
- 개발 환경: 모든 origin 허용 (보안 주의)
- 운영 환경: 프론트엔드 도메인 명시

**백엔드 컨테이너 재시작:**
```bash
cd ../subwayAIv2_api_web
./scripts/run-dev.sh restart
```

### 방법 3: 백엔드에서 모든 Origin 허용 (개발 환경만)

개발 환경에서만 임시로 모든 origin을 허용:

**`subwayAIv2_api_web/.env.dev` 파일:**
```bash
# 개발 환경에서만 사용 (보안 주의!)
CORS_ORIGINS=*
```

또는 백엔드 코드 수정:
```python
# app/core/middleware.py
allow_origins=["*"]  # 개발 환경에서만
```

## 현재 설정 확인

### 프론트엔드 설정 확인:
```bash
cd subwayAIv2_front_web
cat .env.dev | grep VITE_API_BASE
```

### 백엔드 CORS 설정 확인:
```bash
cd ../subwayAIv2_api_web
cat .env.dev | grep CORS_ORIGINS
```

## 권장 사항

**개발 환경:**
- 방법 1 (Vite Proxy) 사용 권장
- CORS 문제 없음
- 설정 간단

**운영 환경:**
- 백엔드 CORS에 프론트엔드 도메인 명시
- 보안 강화

