# =========================
# Makefile (Front Web) — dev/prod 분리
# =========================
SHELL   := /usr/bin/env bash

LOG_TAIL ?= 200

.PHONY: help env-print env-check \
        net-create \
        dev-up dev-down dev-restart dev-logs dev-ps \
        prod-up prod-down prod-restart prod-logs prod-ps \
        build preview clean deps

# -------------------------
# 안내/점검
# -------------------------
help:
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "[Development]"
	@echo "  dev-up              개발 환경 컨테이너 기동 (vite dev 서버)"
	@echo "  dev-down            개발 환경 컨테이너 중지"
	@echo "  dev-restart         개발 환경 컨테이너 재시작"
	@echo "  dev-logs             개발 환경 로그 확인"
	@echo "  dev-ps               개발 환경 컨테이너 상태 확인"
	@echo ""
	@echo "[Production]"
	@echo "  prod-up              운영 환경 컨테이너 기동 (nginx)"
	@echo "  prod-down            운영 환경 컨테이너 중지"
	@echo "  prod-restart         운영 환경 컨테이너 재시작"
	@echo "  prod-logs             운영 환경 로그 확인"
	@echo "  prod-ps               운영 환경 컨테이너 상태 확인"
	@echo ""
	@echo "[Common]"
	@echo "  net-create           도커 네트워크를 없으면 생성"
	@echo "  env-print            환경 변수 출력 (dev/prod)"
	@echo "  env-check            필수 환경값 확인"
	@echo "  build                프로덕션 빌드 (도커 외부)"
	@echo "  preview              빌드 결과 vite preview (도커 외부)"
	@echo "  clean                node_modules 볼륨 삭제"
	@echo "  deps                 컨테이너 내부에서 npm ci"
	@echo ""

env-print:
	@echo "[Development]"
	@if [ -f .env.dev ]; then \
		echo "ENV_FILE: .env.dev"; \
		echo "PROJECT: $$(grep '^PROJECT=' .env.dev | cut -d'=' -f2)"; \
		echo "NET: $$(grep '^NET=' .env.dev | cut -d'=' -f2)"; \
		echo "C_WEB: $$(grep '^C_WEB=' .env.dev | cut -d'=' -f2)"; \
		echo "APP_PORT: $$(grep '^APP_PORT=' .env.dev | cut -d'=' -f2)"; \
	else \
		echo "❌ .env.dev 파일이 없습니다."; \
	fi
	@echo ""
	@echo "[Production]"
	@if [ -f .env.prod ]; then \
		echo "ENV_FILE: .env.prod"; \
		echo "PROJECT: $$(grep '^PROJECT=' .env.prod | cut -d'=' -f2)"; \
		echo "NET: $$(grep '^NET=' .env.prod | cut -d'=' -f2)"; \
		echo "C_WEB: $$(grep '^C_WEB=' .env.prod | cut -d'=' -f2)"; \
		echo "APP_PORT: $$(grep '^APP_PORT=' .env.prod | cut -d'=' -f2)"; \
	else \
		echo "❌ .env.prod 파일이 없습니다."; \
	fi

env-check:
	@if [ -z "$${ENV_MODE}" ]; then \
		echo "❌ ENV_MODE 환경 변수를 설정하세요. (dev 또는 prod)"; \
		exit 1; \
	fi
	@if [ "$${ENV_MODE}" = "dev" ]; then \
		if [ ! -f .env.dev ]; then \
			echo "❌ .env.dev 파일이 없습니다. env.dev.example을 복사하여 생성하세요."; \
			exit 1; \
		fi; \
	elif [ "$${ENV_MODE}" = "prod" ]; then \
		if [ ! -f .env.prod ]; then \
			echo "❌ .env.prod 파일이 없습니다. env.prod.example을 복사하여 생성하세요."; \
			exit 1; \
		fi; \
	fi
	@echo "✅ env ok"

# -------------------------
# Common Docker helpers
# -------------------------
net-create:
	@if [ -f .env.dev ]; then \
		NET=$$(grep '^NET=' .env.dev | cut -d'=' -f2 | tr -d ' '); \
	elif [ -f .env.prod ]; then \
		NET=$$(grep '^NET=' .env.prod | cut -d'=' -f2 | tr -d ' '); \
	else \
		echo "❌ .env.dev 또는 .env.prod 파일이 없습니다."; \
		exit 1; \
	fi; \
	if [ -z "$$NET" ]; then \
		echo "❌ NET 환경 변수가 설정되지 않았습니다."; \
		exit 1; \
	fi; \
	docker network inspect $$NET >/dev/null 2>&1 || docker network create $$NET; \
	echo "✅ network ready: $$NET"

# =========================
# 개발 환경 (Development)
# =========================
DEV_COMPOSE := docker compose -f docker-compose.dev.yml
DEV_ENV_FILE := .env.dev

dev-up: net-create
	@if [ ! -f "$(DEV_ENV_FILE)" ]; then \
		echo "❌ $(DEV_ENV_FILE) 파일이 없습니다. env.dev.example을 복사하여 생성하세요."; \
		exit 1; \
	fi
	@mkdir -p logs
	@chmod 755 logs 2>/dev/null || true
	@echo "🔨 개발 환경 컨테이너 시작 중..."
	@echo "   (의존성 설치가 필요하면 자동으로 설치됩니다)"
	$(DEV_COMPOSE) --env-file $(DEV_ENV_FILE) up -d web
	@echo "⏳ 컨테이너 시작 대기 중..."
	@sleep 3
	$(DEV_COMPOSE) --env-file $(DEV_ENV_FILE) ps web
	@echo "✅ 개발 환경 서비스 시작 완료"
	@echo "WEB: http://localhost:$$(grep APP_PORT $(DEV_ENV_FILE) | cut -d'=' -f2 | tr -d ' ')"
	@echo "💡 로그 확인: make dev-logs"

dev-down:
	$(DEV_COMPOSE) --env-file $(DEV_ENV_FILE) down
	@echo "🛑 개발 환경 서비스 중지 완료"

dev-restart: dev-down
	@sleep 2
	@$(MAKE) dev-up

dev-logs:
	$(DEV_COMPOSE) --env-file $(DEV_ENV_FILE) logs -f --tail=$(LOG_TAIL) web

dev-ps:
	$(DEV_COMPOSE) --env-file $(DEV_ENV_FILE) ps web

# =========================
# 운영 환경 (Production)
# =========================
PROD_COMPOSE := docker compose -f docker-compose.prod.yml
PROD_ENV_FILE := .env.prod

prod-up: net-create
	@if [ ! -f "$(PROD_ENV_FILE)" ]; then \
		echo "❌ $(PROD_ENV_FILE) 파일이 없습니다. env.prod.example을 복사하여 생성하세요."; \
		exit 1; \
	fi
	@mkdir -p logs
	@chmod 755 logs 2>/dev/null || true
	@echo "🔨 이미지 빌드 및 컨테이너 시작 중..."
	$(PROD_COMPOSE) --env-file $(PROD_ENV_FILE) build --progress=plain
	$(PROD_COMPOSE) --env-file $(PROD_ENV_FILE) up -d web
	$(PROD_COMPOSE) --env-file $(PROD_ENV_FILE) ps web
	@echo "✅ 운영 환경 서비스 시작 완료"
	@echo "WEB: http://localhost:$$(grep APP_PORT $(PROD_ENV_FILE) | cut -d'=' -f2 | tr -d ' ')"

prod-down:
	$(PROD_COMPOSE) --env-file $(PROD_ENV_FILE) down
	@echo "🛑 운영 환경 서비스 중지 완료"

prod-restart: prod-down
	@sleep 2
	@$(MAKE) prod-up

prod-logs:
	$(PROD_COMPOSE) --env-file $(PROD_ENV_FILE) logs -f --tail=$(LOG_TAIL) web

prod-ps:
	$(PROD_COMPOSE) --env-file $(PROD_ENV_FILE) ps web

# -------------------------
# 빌드/미리보기 (도커 외부)
# -------------------------
build:
	npm run build

preview:
	@if [ -f .env.prod ]; then \
		set -a; source .env.prod 2>/dev/null || true; set +a; \
		npm run preview -- --host 0.0.0.0 --port $${APP_PORT:-3001}; \
	else \
		npm run preview -- --host 0.0.0.0 --port 3001; \
	fi

# -------------------------
# 캐시/의존성
# -------------------------
clean:
	@if [ -f .env.dev ]; then \
		COMPOSE_PROJECT=$$(grep '^PROJECT=' .env.dev | cut -d'=' -f2)_front_dev; \
		VOLUME_NODE=$${COMPOSE_PROJECT}_node_modules; \
		docker volume rm -f $$VOLUME_NODE 2>/dev/null || true; \
		echo "🧹 volume removed(if existed): $$VOLUME_NODE"; \
	fi

deps:
	@if [ -f .env.dev ]; then \
		$(DEV_COMPOSE) --env-file $(DEV_ENV_FILE) exec web npm ci; \
	else \
		echo "❌ .env.dev 파일이 없습니다."; \
		exit 1; \
	fi

