#!/bin/bash
# 운영 환경 실행 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# 스크립트 디렉토리로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# 환경 변수 파일 경로
ENV_FILE=".env.prod"

# Offline 모드 확인 (첫 번째 인자가 "offline"이면 오프라인 모드)
if [ "$1" = "offline" ]; then
    COMPOSE_FILE="docker-compose.prod.offline.yml"
    OFFLINE_MODE=true
    shift  # "offline" 인자 제거
else
    COMPOSE_FILE="docker-compose.prod.yml"
    OFFLINE_MODE=false
fi

COMPOSE_CMD="docker compose -f $COMPOSE_FILE"

# 환경 파일 확인
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}[ERROR]${NC} $ENV_FILE 파일이 없습니다."
    echo -e "${YELLOW}env.prod.example을 복사하여 $ENV_FILE을 생성하세요:${NC}"
    echo "  cp env.prod.example $ENV_FILE"
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
    echo -e "${RED}[ERROR]${NC} 필수 환경 변수가 설정되지 않았습니다."
    echo "  APP_PORT, NET, C_WEB를 확인하세요."
    exit 1
fi

# 필수 디렉토리 자동 생성
echo -e "${YELLOW}📁 필수 디렉토리 확인 및 생성 중...${NC}"
mkdir -p "$PROJECT_DIR/logs"
chmod 755 "$PROJECT_DIR/logs" 2>/dev/null || true
echo -e "${GREEN}✅ 디렉토리 준비 완료${NC}"

# 운영 환경 확인
if [ "$ENVIRONMENT" != "production" ]; then
    echo -e "${YELLOW}[WARNING]${NC} ENVIRONMENT가 'production'이 아닙니다. (현재: $ENVIRONMENT)"
    read -p "계속하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 함수 정의
print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

check_docker() {
    print_step "Docker 설치 확인 중..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker가 설치되어 있지 않습니다."
        echo -e "${YELLOW}Docker 설치 방법: https://docs.docker.com/get-docker/${NC}"
        exit 1
    fi
    print_success "Docker 설치 확인 완료"
    
    print_step "Docker 데몬 실행 확인 중..."
    if ! docker info &> /dev/null; then
        print_error "Docker 데몬이 실행 중이지 않습니다."
        echo -e "${YELLOW}Docker 데몬을 시작하세요:${NC}"
        echo "  - Linux: sudo systemctl start docker"
        echo "  - macOS: Docker Desktop 실행"
        echo "  - Windows: Docker Desktop 실행"
        exit 1
    fi
    print_success "Docker 데몬 실행 확인 완료"
    
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    print_info "Docker 버전: ${DOCKER_VERSION}"
}

create_network() {
    print_step "Docker 네트워크 확인 중: ${NET}"
    if ! docker network inspect "$NET" &> /dev/null; then
        print_info "네트워크가 없습니다. 생성 중..."
        if docker network create "$NET" &>/dev/null; then
            print_success "네트워크 생성 완료: ${NET}"
        else
            print_error "네트워크 생성 실패"
            exit 1
        fi
    else
        print_success "네트워크 확인 완료: ${NET}"
    fi
}

build_image() {
    print_step "Docker 이미지 빌드 중..."
    print_info "이 작업은 시간이 걸릴 수 있습니다..."
    print_info "환경 변수 확인:"
    print_info "  VITE_API_BASE=${VITE_API_BASE:-}"
    print_info "  VITE_API_PREFIX=${VITE_API_PREFIX:-/api}"
    print_info "  VITE_APP_TITLE=${VITE_APP_TITLE:-SubwayAI v2 관리 대시보드}"
    print_info "  VITE_APP_VERSION=${VITE_APP_VERSION:-1.0.0}"
    
    # 빌드 시 환경 변수 전달 (한 번에 빌드)
    if $COMPOSE_CMD --env-file "$ENV_FILE" build --progress=plain; then
        print_success "이미지 빌드 완료"
    else
        print_error "이미지 빌드 실패"
        exit 1
    fi
}

check_existing_containers() {
    print_step "기존 컨테이너 확인 중..."
    EXISTING_CONTAINERS=$($COMPOSE_CMD --env-file "$ENV_FILE" ps -q web 2>/dev/null || true)
    if [ -n "$EXISTING_CONTAINERS" ]; then
        RUNNING_CONTAINERS=$($COMPOSE_CMD --env-file "$ENV_FILE" ps --filter "status=running" -q web 2>/dev/null || true)
        if [ -n "$RUNNING_CONTAINERS" ]; then
            print_info "실행 중인 컨테이너가 있습니다."
            $COMPOSE_CMD --env-file "$ENV_FILE" ps web
            echo ""
            read -p "기존 컨테이너를 재시작하시겠습니까? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_step "컨테이너 재시작 중..."
                $COMPOSE_CMD --env-file "$ENV_FILE" restart web
                print_success "컨테이너 재시작 완료"
                return 0
            else
                print_info "기존 컨테이너를 유지합니다."
                return 0
            fi
        fi
    fi
    return 1
}

start_services() {
    print_step "운영 환경 서비스 시작 중..."
    
    if check_existing_containers; then
        return 0
    fi
    
    print_info "새로운 컨테이너를 시작합니다..."
    if $COMPOSE_CMD --env-file "$ENV_FILE" up -d web; then
        print_success "서비스 시작 완료"
        
        print_step "컨테이너 시작 대기 중... (최대 15초)"
        for i in {1..15}; do
            if $COMPOSE_CMD --env-file "$ENV_FILE" ps --filter "status=running" | grep -q "Up"; then
                print_success "컨테이너가 정상적으로 시작되었습니다."
                break
            fi
            sleep 1
            echo -n "."
        done
        echo ""
    else
        print_error "서비스 시작 실패"
        exit 1
    fi
}

show_status() {
    print_header "서비스 상태"
    
    $COMPOSE_CMD --env-file "$ENV_FILE" ps web
    
    echo ""
    print_header "서비스 정보"
    echo -e "${GREEN}  [1] 웹 서비스:${NC}    ${C_WEB}"
    echo -e "${GREEN}  [2] 포트:${NC}          ${APP_PORT}"
    echo ""
    
    print_header "접속 정보"
    echo -e "${GREEN}  [1] 웹 애플리케이션:${NC}  http://localhost:$APP_PORT"
    echo ""
    
    print_step "서비스 응답 확인 중..."
    sleep 3
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$APP_PORT" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
        print_success "서비스가 정상적으로 실행 중입니다. (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "000" ]; then
        print_error "서비스에 연결할 수 없습니다. 서비스가 아직 시작 중일 수 있습니다."
        echo -e "${YELLOW}잠시 후 다시 시도하거나 로그를 확인하세요: ./scripts/run-prod.sh logs${NC}"
    else
        print_error "서비스가 실행 중이지만 응답이 비정상입니다. (HTTP $HTTP_CODE)"
        echo -e "${YELLOW}로그를 확인하세요: ./scripts/run-prod.sh logs${NC}"
    fi
    echo ""
}

show_logs() {
    local service="$1"
    print_header "서비스 로그"
    echo -e "${YELLOW}로그를 확인합니다. (Ctrl+C로 종료)${NC}"
    echo ""
    if [ -z "$service" ]; then
        $COMPOSE_CMD --env-file "$ENV_FILE" logs -f --tail=200 web 2>&1
    else
        $COMPOSE_CMD --env-file "$ENV_FILE" logs -f --tail=200 "$service" 2>&1
    fi
}

show_menu() {
    print_header "사용 가능한 명령어"
    echo -e "${CYAN}  start${NC}     - 서비스 시작 (기본 동작)"
    echo -e "${CYAN}  offline start${NC} - 오프라인 모드로 서비스 시작"
    echo -e "${CYAN}  build${NC}     - 이미지 빌드 후 서비스 시작"
    echo -e "${CYAN}  stop${NC}      - 서비스 중지"
    echo -e "${CYAN}  restart${NC}   - 서비스 재시작"
    echo -e "${CYAN}  status${NC}    - 서비스 상태 확인"
    echo -e "${CYAN}  logs${NC}      - 서비스 로그 확인"
    echo -e "${CYAN}  down${NC}     - 서비스 중지 및 컨테이너 제거"
    echo ""
}

rebuild_services() {
    print_step "기존 서비스 중지 및 컨테이너 제거 중..."
    # 모든 서비스 중지
    $COMPOSE_CMD --env-file "$ENV_FILE" stop 2>/dev/null || true
    # 모든 서비스 제거 (볼륨 제외, 이미지도 삭제)
    $COMPOSE_CMD --env-file "$ENV_FILE" down --remove-orphans --rmi local 2>/dev/null || true
    # 개별 컨테이너도 명시적으로 제거
    docker rm -f "${C_WEB}" 2>/dev/null || true
    # 이미지도 삭제
    IMAGE_NAME_FULL="${IMAGE_NAME:-subwayaiv2-front-web}:prod"
    docker rmi "${IMAGE_NAME_FULL}" 2>/dev/null || true
    print_success "기존 서비스 제거 완료"
    
    print_step "Docker 이미지 빌드 중..."
    if $COMPOSE_CMD --env-file "$ENV_FILE" build; then
        print_success "이미지 빌드 완료"
    else
        print_error "이미지 빌드 실패"
        exit 1
    fi
    
    print_step "서비스 시작 중..."
    if $COMPOSE_CMD --env-file "$ENV_FILE" up -d web; then
        print_success "서비스 시작 완료"
        sleep 2
        show_status
    else
        print_error "서비스 시작 실패"
        exit 1
    fi
}

rebuild_services_offline() {
    # 오프라인 모드용 compose 파일 사용
    local OFFLINE_COMPOSE_FILE="docker-compose.prod.offline.yml"
    local OFFLINE_COMPOSE_CMD="docker compose -f $OFFLINE_COMPOSE_FILE"
    
    print_step "기존 서비스 중지 및 컨테이너 제거 중..."
    # 모든 서비스 중지 (온라인/오프라인 모두)
    $COMPOSE_CMD --env-file "$ENV_FILE" stop 2>/dev/null || true
    $OFFLINE_COMPOSE_CMD --env-file "$ENV_FILE" stop 2>/dev/null || true
    # 모든 서비스 제거 (볼륨 제외, 이미지도 삭제)
    $COMPOSE_CMD --env-file "$ENV_FILE" down --remove-orphans --rmi local 2>/dev/null || true
    $OFFLINE_COMPOSE_CMD --env-file "$ENV_FILE" down --remove-orphans --rmi local 2>/dev/null || true
    # 개별 컨테이너도 명시적으로 제거
    docker rm -f "${C_WEB}" 2>/dev/null || true
    # 이미지도 삭제
    IMAGE_NAME_FULL="${IMAGE_NAME:-subwayaiv2-front-web}:prod"
    docker rmi "${IMAGE_NAME_FULL}" 2>/dev/null || true
    print_success "기존 서비스 제거 완료"
    
    print_step "Docker 이미지 빌드 중 (오프라인 모드)..."
    # 오프라인 빌드는 상위 디렉토리를 빌드 컨텍스트로 사용 (npm 패키지 경로 때문)
    if docker build -t "$IMAGE_NAME_FULL" -f Dockerfile.offline ..; then
        print_success "이미지 빌드 완료: ${IMAGE_NAME_FULL}"
    else
        print_error "이미지 빌드 실패"
        exit 1
    fi
    
    print_step "서비스 시작 중 (오프라인 모드)..."
    if $OFFLINE_COMPOSE_CMD --env-file "$ENV_FILE" up -d web; then
        print_success "서비스 시작 완료"
        sleep 2
        # 상태 확인은 오프라인 compose 파일 사용
        $OFFLINE_COMPOSE_CMD --env-file "$ENV_FILE" ps web
    else
        print_error "서비스 시작 실패"
        exit 1
    fi
}

show_rebuild_menu() {
    while true; do
        echo ""
        print_header "서비스 재빌드 메뉴"
        echo -e "${BOLD}재빌드 모드를 선택하세요:${NC}"
        echo "  [1] 온라인 모드로 재빌드 (기존 컨테이너 제거 → 빌드 → 시작)"
        echo "  [2] 오프라인 모드로 재빌드 (기존 컨테이너 제거 → 빌드 → 시작)"
        echo "  [0] 이전 메뉴로 돌아가기"
        echo ""
        read -p "선택 (0-2): " rebuild_choice
        
        case $rebuild_choice in
            1)
                check_docker
                create_network
                rebuild_services
                break
                ;;
            2)
                check_docker
                create_network
                rebuild_services_offline
                break
                ;;
            0)
                break
                ;;
            *)
                print_error "잘못된 선택입니다."
                ;;
        esac
    done
}

interactive_menu() {
    while true; do
        echo ""
        print_header "운영 환경 관리 메뉴"
        echo -e "${BOLD}번호를 선택하세요:${NC}"
        echo "  [1] 서비스 시작"
        echo "  [2] 서비스 중지"
        echo "  [3] 서비스 재시작"
        echo "  [4] 서비스 상태 확인"
        echo "  [5] 서비스 재빌드"
        echo "  [6] 로그 확인"
        echo "  [7] 도움말"
        echo "  [0] 종료"
        echo ""
        read -p "선택 (0-7): " choice
        
        case $choice in
            1)
                check_docker
                create_network
                start_services
                show_status
                ;;
            2)
                print_step "서비스 중지 중..."
                $COMPOSE_CMD --env-file "$ENV_FILE" stop web
                print_success "서비스 중지 완료"
                ;;
            3)
                print_step "서비스 재시작 중..."
                $COMPOSE_CMD --env-file "$ENV_FILE" restart web
                print_success "서비스 재시작 완료"
                sleep 2
                show_status
                ;;
            4)
                show_status
                ;;
            5)
                show_rebuild_menu
                ;;
            6)
                show_logs
                ;;
            7)
                show_menu
                ;;
            0)
                print_info "종료합니다."
                exit 0
                ;;
            *)
                print_error "잘못된 선택입니다."
                ;;
        esac
    done
}

# 메인 실행
main() {
    if [ "$OFFLINE_MODE" = "true" ]; then
        print_header "운영 환경 실행 스크립트 (오프라인 모드)"
    else
        print_header "운영 환경 실행 스크립트"
    fi
    
    print_info "환경 파일: ${ENV_FILE}"
    print_info "Compose 파일: ${COMPOSE_FILE}"
    if [ "$OFFLINE_MODE" = "true" ]; then
        print_info "모드: ${YELLOW}오프라인${NC}"
    fi
    print_info "프로젝트: ${PROJECT}"
    print_info "네트워크: ${NET}"
    print_info "컨테이너: ${C_WEB}"
    print_info "포트: ${APP_PORT}"
    print_info "환경: ${ENVIRONMENT}"
    echo ""
    
    # 명령어가 없으면 대화형 메뉴 실행
    if [ -z "$1" ]; then
        check_docker
        interactive_menu
        exit 0
    fi
    
    case "$1" in
        start)
            check_docker
            create_network
            start_services
            show_status
            echo ""
            print_header "다음 단계"
            echo -e "${CYAN}  [1] 로그 확인:${NC}     ./scripts/run-prod.sh logs"
            echo -e "${CYAN}  [2] 서비스 중지:${NC}   ./scripts/run-prod.sh stop"
            echo -e "${CYAN}  [3] 대화형 메뉴:${NC}   ./scripts/run-prod.sh menu"
            echo ""
            ;;
        build)
            check_docker
            create_network
            build_image
            start_services
            show_status
            ;;
        stop)
            print_step "서비스 중지 중..."
            $COMPOSE_CMD --env-file "$ENV_FILE" stop web
            print_success "서비스 중지 완료"
            ;;
        restart)
            check_docker
            print_step "서비스 재시작 중..."
            $COMPOSE_CMD --env-file "$ENV_FILE" restart web
            print_success "서비스 재시작 완료"
            sleep 2
            show_status
            ;;
        status)
            check_docker
            show_status
            ;;
        logs)
            check_docker
            show_logs
            ;;
        down)
            print_step "서비스 중지 및 컨테이너 제거 중..."
            $COMPOSE_CMD --env-file "$ENV_FILE" stop web 2>/dev/null || true
            $COMPOSE_CMD --env-file "$ENV_FILE" down --remove-orphans --rmi local 2>/dev/null || true
            docker rm -f "${C_WEB}" 2>/dev/null || true
            IMAGE_NAME_FULL="${IMAGE_NAME:-subwayaiv2-front-web}:prod"
            docker rmi "${IMAGE_NAME_FULL}" 2>/dev/null || true
            print_success "서비스 중지 및 컨테이너/이미지 제거 완료"
            ;;
        menu|interactive)
            check_docker
            interactive_menu
            ;;
        help|--help|-h)
            show_menu
            ;;
        *)
            print_error "알 수 없는 명령어: $1"
            echo ""
            show_menu
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@"
