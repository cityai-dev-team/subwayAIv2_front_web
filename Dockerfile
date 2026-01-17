# Multi-stage build for React app
FROM node:20-alpine AS builder

WORKDIR /app

# 빌드 시 필요한 환경 변수 (ARG로 받아서 ENV로 전달)
ARG VITE_API_BASE
ARG VITE_API_PREFIX
ARG VITE_APP_TITLE
ARG VITE_APP_VERSION

ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_API_PREFIX=${VITE_API_PREFIX}
ENV VITE_APP_TITLE=${VITE_APP_TITLE}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}

# 의존성 파일 복사 및 설치 (한 번에 처리)
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# 소스 코드 복사 및 빌드 (한 번에 처리)
COPY . .
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# 빌드 결과물 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 포트 노출
EXPOSE 3001

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3001/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
