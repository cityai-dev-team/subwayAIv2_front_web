#!/bin/bash
# 개발 환경 실행 스크립트

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
ENV_FILE=".env.dev"
COMPOSE_FILE="docker-compose.dev.yml"
COMPOSE_CMD="docker compose -f $COMPOSE_FILE"

# 환경 파일 확인
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}[ERROR]${NC} $ENV_FILE 파일이 없습니다."
    echo -e "${YELLOW}env.dev.example을 복사하여 $ENV_FILE을 생성하세요:${NC}"
    echo "  cp env.dev.example $ENV_FILE"
    exit 1
fi

# 환경 변수 로드 (Windows 줄바꿈 문자 제거, 주석 및 빈 줄 제거)
set -a
TMP_ENV=$(mktemp)
# CRLF 제거, 주석 제거, 빈 줄 제거, export 가능한 형식으로 변환
sed 's/\r$//' "$ENV_FILE" | \
    grep -v '^[[:space:]]*#' | \
    grep -v '^[[:space:]]*$' | \
    sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | \
    grep -v '^$' > "$TMP_ENV" || true
if [ -s "$TMP_ENV" ]; then
    source "$TMP_ENV"
fi
rm -f "$TMP_ENV"
set +a

# 필수 환경 변수 확인
if [ -z "$APP_PORT" ] || [ -z "$NET" ] || [ -z "$C_WEB" ]; then
    echo -e "${RED}[ERROR]${NC} 필수 환경 변수가 설정되지 않았습니다."
    echo "  APP_PORT, NET, C_WEB를 확인하세요."
    exit 1
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
    echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} ${YELLOW}[STEP]${NC} $1"
}

print_success() {
    echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} ${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} ${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} ${CYAN}[INFO]${NC} $1"
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

check_existing_containers() {
    print_step "기존 컨테이너 확인 중..."
    EXISTING_CONTAINERS=$($COMPOSE_CMD --env-file "$ENV_FILE" ps -q 2>/dev/null || true)
    if [ -n "$EXISTING_CONTAINERS" ]; then
        RUNNING_CONTAINERS=$($COMPOSE_CMD --env-file "$ENV_FILE" ps --filter "status=running" -q 2>/dev/null || true)
        if [ -n "$RUNNING_CONTAINERS" ]; then
            print_info "실행 중인 컨테이너가 있습니다."
            $COMPOSE_CMD --env-file "$ENV_FILE" ps
            echo ""
            read -p "기존 컨테이너를 재시작하시겠습니까? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_step "컨테이너 재시작 중..."
                $COMPOSE_CMD --env-file "$ENV_FILE" restart
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
    print_step "개발 환경 서비스 시작 중..."
    
    # 기존 컨테이너 확인
    if check_existing_containers; then
        return 0
    fi
    
    print_info "새로운 컨테이너를 시작합니다..."
    if $COMPOSE_CMD --env-file "$ENV_FILE" up -d --build; then
        print_success "서비스 시작 완료"
        
        # 컨테이너 시작 대기
        print_step "컨테이너 시작 대기 중... (최대 10초)"
        for i in {1..10}; do
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
    
    # 컨테이너 상태 표시
    $COMPOSE_CMD --env-file "$ENV_FILE" ps
    
    echo ""
    print_header "접속 정보"
    echo -e "${GREEN}  [1] 웹 애플리케이션:${NC}  http://localhost:$APP_PORT"
    echo ""
    
    # 헬스 체크 시도
    print_step "서비스 응답 확인 중..."
    sleep 2
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$APP_PORT" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
        print_success "서비스가 정상적으로 실행 중입니다. (HTTP $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "000" ]; then
        print_error "서비스에 연결할 수 없습니다. 서비스가 아직 시작 중일 수 있습니다."
        echo -e "${YELLOW}잠시 후 다시 시도하거나 로그를 확인하세요: ./scripts/run-dev.sh logs${NC}"
    else
        print_error "서비스가 실행 중이지만 응답이 비정상입니다. (HTTP $HTTP_CODE)"
        echo -e "${YELLOW}로그를 확인하세요: ./scripts/run-dev.sh logs${NC}"
    fi
    echo ""
}

show_logs() {
    print_header "서비스 로그"
    echo -e "${YELLOW}로그를 확인합니다. (Ctrl+C로 종료)${NC}"
    echo ""
    $COMPOSE_CMD --env-file "$ENV_FILE" logs -f --tail=200 web
}

show_menu() {
    print_header "사용 가능한 명령어"
    echo -e "${CYAN}  start${NC}     - 서비스 시작 (기본 동작)"
    echo -e "${CYAN}  stop${NC}      - 서비스 중지"
    echo -e "${CYAN}  restart${NC}   - 서비스 재시작"
    echo -e "${CYAN}  status${NC}    - 서비스 상태 확인"
    echo -e "${CYAN}  logs${NC}     - 서비스 로그 확인"
    echo -e "${CYAN}  down${NC}     - 서비스 중지 및 컨테이너 제거"
    echo ""
}

interactive_menu() {
    while true; do
        echo ""
        print_header "개발 환경 관리 메뉴"
        echo -e "${BOLD}번호를 선택하세요:${NC}"
        echo "  [1] 서비스 시작"
        echo "  [2] 서비스 중지"
        echo "  [3] 서비스 재시작"
        echo "  [4] 서비스 상태 확인"
        echo "  [5] 로그 확인"
        echo "  [6] 서비스 중지 및 컨테이너 제거"
        echo "  [7] 도움말"
        echo "  [0] 종료"
        echo ""
        read -p "선택 (0-7): " choice
        
        case $choice in
            1)
                start_services
                show_status
                ;;
            2)
                print_step "서비스 중지 중..."
                $COMPOSE_CMD --env-file "$ENV_FILE" stop
                print_success "서비스 중지 완료"
                ;;
            3)
                print_step "서비스 재시작 중..."
                $COMPOSE_CMD --env-file "$ENV_FILE" restart
                print_success "서비스 재시작 완료"
                sleep 2
                show_status
                ;;
            4)
                show_status
                ;;
            5)
                show_logs
                ;;
            6)
                print_step "서비스 중지 및 컨테이너 제거 중..."
                $COMPOSE_CMD --env-file "$ENV_FILE" down
                print_success "서비스 중지 및 컨테이너 제거 완료"
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
    print_header "개발 환경 실행 스크립트"
    
    # 환경 정보 표시
    print_info "환경 파일: ${ENV_FILE}"
    print_info "프로젝트: ${PROJECT}"
    print_info "네트워크: ${NET}"
    print_info "컨테이너: ${C_WEB}"
    print_info "포트: ${APP_PORT}"
    echo ""
    
    # 명령어가 없으면 대화형 메뉴 실행
    if [ -z "$1" ]; then
        check_docker
        interactive_menu
        exit 0
    fi
    
    # 명령어별 처리
    case "$1" in
        start)
            check_docker
            create_network
            start_services
            show_status
            echo ""
            print_header "다음 단계"
            echo -e "${CYAN}  [1] 로그 확인:${NC}     ./scripts/run-dev.sh logs"
            echo -e "${CYAN}  [2] 서비스 중지:${NC}   ./scripts/run-dev.sh stop"
            echo -e "${CYAN}  [3] 대화형 메뉴:${NC}   ./scripts/run-dev.sh menu"
            echo ""
            ;;
        stop)
            print_step "서비스 중지 중..."
            $COMPOSE_CMD --env-file "$ENV_FILE" stop
            print_success "서비스 중지 완료"
            ;;
        restart)
            check_docker
            print_step "서비스 재시작 중..."
            $COMPOSE_CMD --env-file "$ENV_FILE" restart
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
            $COMPOSE_CMD --env-file "$ENV_FILE" down
            print_success "서비스 중지 및 컨테이너 제거 완료"
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

