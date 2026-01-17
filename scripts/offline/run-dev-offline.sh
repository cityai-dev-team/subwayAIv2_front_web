#!/bin/bash
# 개발 환경 오프라인 실행 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 스크립트 디렉토리로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_DIR"

# 환경 변수 파일 경로
ENV_FILE=".env.dev"
COMPOSE_FILE="docker-compose.dev.offline.yml"
COMPOSE_CMD="docker compose -f $COMPOSE_FILE"

# 환경 파일 확인
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ $ENV_FILE 파일이 없습니다.${NC}"
    echo -e "${YELLOW}env.dev.example을 복사하여 $ENV_FILE을 생성하세요:${NC}"
    echo "  cp env.dev.example $ENV_FILE"
    exit 1
fi

# 환경 변수 로드 (Windows 줄바꿈 문자 제거)
set -a
TMP_ENV=$(mktemp)
sed 's/\r$//' "$ENV_FILE" > "$TMP_ENV"
source "$TMP_ENV"
rm -f "$TMP_ENV"
set +a

# 필수 환경 변수 확인
if [ -z "$APP_PORT" ] || [ -z "$NET" ] || [ -z "$C_WEB" ]; then
    echo -e "${RED}❌ 필수 환경 변수가 설정되지 않았습니다.${NC}"
    echo "  APP_PORT, NET, C_WEB를 확인하세요."
    exit 1
fi

# 함수 정의
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker가 설치되어 있지 않습니다.${NC}"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker 데몬이 실행 중이지 않습니다.${NC}"
        exit 1
    fi
}

create_network() {
    if ! docker network inspect "$NET" &> /dev/null; then
        echo -e "${YELLOW}📡 Docker 네트워크 생성 중: $NET${NC}"
        docker network create "$NET"
        echo -e "${GREEN}✅ 네트워크 생성 완료${NC}"
    else
        echo -e "${GREEN}✅ 네트워크 확인: $NET${NC}"
    fi
}

check_dependencies() {
    local deps_dir="${DEPENDENCIES_DIR:-$PROJECT_DIR/../subwayAIv2_images/front_web/npm-packages}"
    if [ ! -d "$deps_dir" ] || [ -z "$(ls -A "$deps_dir"/*.tgz 2>/dev/null)" ]; then
        echo -e "${YELLOW}⚠️  npm 패키지가 없습니다.${NC}"
        echo -e "${YELLOW}npm 패키지 다운로드 방법:${NC}"
        echo "  ./scripts/offline/download-dependencies.sh"
        echo ""
        echo -e "${BLUE}[INFO] 오프라인 모드이지만 --prefer-offline을 사용하므로 네트워크가 있으면 자동으로 다운로드됩니다.${NC}"
        read -p "계속하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo -e "${GREEN}✅ npm 패키지 확인: $deps_dir${NC}"
        local tgz_count=$(find "$deps_dir" -name "*.tgz" 2>/dev/null | wc -l)
        echo -e "${BLUE}   패키지 파일: ${tgz_count}개${NC}"
    fi
}

start_services() {
    echo -e "${YELLOW}🚀 개발 환경 서비스 시작 중 (오프라인 모드)...${NC}"
    echo -e "${BLUE}[INFO] npm install --prefer-offline을 사용하여 캐시 우선, 없으면 네트워크에서 다운로드합니다.${NC}"
    
    if $COMPOSE_CMD --env-file "$ENV_FILE" up -d web; then
        echo -e "${GREEN}✅ 서비스 시작 완료${NC}"
        
        # 컨테이너 시작 대기
        echo -e "${YELLOW}⏳ 컨테이너 시작 및 의존성 설치 대기 중... (최대 60초)${NC}"
        for i in {1..60}; do
            CONTAINER_STATUS=$($COMPOSE_CMD --env-file "$ENV_FILE" ps --format json 2>/dev/null | grep -o '"State":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
            if [ "$CONTAINER_STATUS" = "running" ]; then
                # vite가 설치되었는지 확인
                if $COMPOSE_CMD --env-file "$ENV_FILE" exec -T web sh -c "test -f node_modules/.bin/vite" 2>/dev/null; then
                    echo -e "${GREEN}✅ 컨테이너가 정상적으로 시작되었습니다.${NC}"
                    break
                fi
            fi
            sleep 1
            if [ $((i % 5)) -eq 0 ]; then
                echo -n "."
            fi
        done
        echo ""
    else
        echo -e "${RED}❌ 서비스 시작 실패${NC}"
        exit 1
    fi
}

show_status() {
    echo ""
    echo -e "${YELLOW}📊 서비스 상태:${NC}"
    $COMPOSE_CMD --env-file "$ENV_FILE" ps web
    echo ""
    echo -e "${GREEN}웹 애플리케이션: http://localhost:$APP_PORT${NC}"
    
    # 헬스 체크 시도
    sleep 2
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:$APP_PORT" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
        echo -e "${GREEN}✅ 서비스가 정상적으로 실행 중입니다. (HTTP $HTTP_CODE)${NC}"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo -e "${YELLOW}⚠️  서비스에 연결할 수 없습니다. 서비스가 아직 시작 중일 수 있습니다.${NC}"
        echo -e "${YELLOW}로그를 확인하세요: ./scripts/offline/run-dev-offline.sh logs${NC}"
    else
        echo -e "${YELLOW}⚠️  서비스가 실행 중이지만 응답이 비정상입니다. (HTTP $HTTP_CODE)${NC}"
        echo -e "${YELLOW}로그를 확인하세요: ./scripts/offline/run-dev-offline.sh logs${NC}"
    fi
}

show_logs() {
    echo -e "${YELLOW}📋 로그 확인 (Ctrl+C로 종료):${NC}"
    $COMPOSE_CMD --env-file "$ENV_FILE" logs -f --tail=200 web
}

load_image() {
    local image_file="$1"
    if [ -z "$image_file" ]; then
        echo -e "${RED}❌ 이미지 파일 경로를 지정해주세요.${NC}"
        echo "사용법: $0 load <image-file.tar>"
        exit 1
    fi
    
    if [ ! -f "$image_file" ]; then
        echo -e "${RED}❌ 이미지 파일을 찾을 수 없습니다: $image_file${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}📦 Docker 이미지 로드 중: $image_file${NC}"
    docker load < "$image_file"
    echo -e "${GREEN}✅ 이미지 로드 완료${NC}"
}

# 메인 실행
main() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  개발 환경 오프라인 실행 스크립트${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    # 'load' 명령어 처리
    if [ "$1" = "load" ]; then
        load_image "$2"
        exit 0
    fi
    
    check_docker
    create_network
    
    # 'down' 명령어 처리
    if [ "$1" = "down" ]; then
        echo -e "${YELLOW}[INFO] 서비스 중지 및 컨테이너 제거 중...${NC}"
        $COMPOSE_CMD --env-file "$ENV_FILE" down
        echo -e "${GREEN}✅ 서비스 중지 및 컨테이너 제거 완료${NC}"
        exit 0
    fi
    
    # 'stop' 명령어 처리
    if [ "$1" = "stop" ]; then
        echo -e "${YELLOW}[INFO] 서비스 중지 중...${NC}"
        $COMPOSE_CMD --env-file "$ENV_FILE" stop web
        echo -e "${GREEN}✅ 서비스 중지 완료${NC}"
        exit 0
    fi
    
    # 'restart' 명령어 처리
    if [ "$1" = "restart" ]; then
        echo -e "${YELLOW}[INFO] 서비스 재시작 중...${NC}"
        $COMPOSE_CMD --env-file "$ENV_FILE" restart web
        echo -e "${GREEN}✅ 서비스 재시작 완료${NC}"
        sleep 2
        show_status
        exit 0
    fi
    
    # 'status' 명령어 처리
    if [ "$1" = "status" ]; then
        show_status
        exit 0
    fi
    
    # 'logs' 명령어 처리
    if [ "$1" = "logs" ]; then
        show_logs
        exit 0
    fi
    
    # 의존성 확인 (경고만 표시, 강제하지 않음)
    check_dependencies
    
    # 서비스 시작
    start_services
    show_status
    
    echo ""
    echo -e "${YELLOW}사용 가능한 명령어:${NC}"
    echo -e "${CYAN}  logs:${NC}   ./scripts/offline/run-dev-offline.sh logs"
    echo -e "${CYAN}  stop:${NC}   ./scripts/offline/run-dev-offline.sh stop"
    echo -e "${CYAN}  down:${NC}   ./scripts/offline/run-dev-offline.sh down"
    echo -e "${CYAN}  status:${NC} ./scripts/offline/run-dev-offline.sh status"
}

# 스크립트 실행
main "$@"

