#!/bin/bash
# 오프라인 환경을 위한 npm 패키지 다운로드 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 스크립트 디렉토리로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_DIR"

# 의존성 저장 경로 설정 (프로젝트 루트 기준 상대 경로)
DEPENDENCIES_DIR="${PROJECT_DIR}/../subwayAIv2_images/front_web"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  오프라인 npm 패키지 다운로드 스크립트${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# package.json 확인
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json 파일을 찾을 수 없습니다.${NC}"
    exit 1
fi

# npm 설치 확인
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm이 설치되어 있지 않습니다.${NC}"
    echo -e "${YELLOW}Node.js를 설치하세요: https://nodejs.org/${NC}"
    exit 1
fi

# 의존성 디렉토리 생성
echo -e "${YELLOW}📁 npm 패키지 저장 디렉토리 생성: ${DEPENDENCIES_DIR}${NC}"
mkdir -p "${DEPENDENCIES_DIR}/npm-packages"

# package-lock.json 확인 및 생성
if [ ! -f "package-lock.json" ]; then
    echo -e "${YELLOW}⚠️  package-lock.json이 없습니다. 생성 중...${NC}"
    npm install --package-lock-only
fi

# node_modules 권한 확인 및 수정
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}🔧 node_modules 권한 확인 중...${NC}"
    sudo chown -R $(whoami):$(whoami) node_modules 2>/dev/null || true
    chmod -R u+w node_modules 2>/dev/null || true
fi

# npm 패키지 다운로드 (캐시에 저장)
echo -e "${YELLOW}📥 npm 패키지 다운로드 중 (캐시에 저장)...${NC}"
echo -e "${BLUE}이 작업은 시간이 걸릴 수 있습니다.${NC}"
npm install --no-audit --no-fund || {
    echo -e "${YELLOW}⚠️  권한 문제로 실패했습니다. sudo를 사용하여 재시도합니다...${NC}"
    sudo npm install --no-audit --no-fund
    sudo chown -R $(whoami):$(whoami) node_modules package-lock.json 2>/dev/null || true
}

# npm 캐시 디렉토리 확인
NPM_CACHE_DIR=$(npm config get cache)
echo -e "${BLUE}npm 캐시 디렉토리: ${NPM_CACHE_DIR}${NC}"

# 방법 1: npm cache를 직접 복사 (가장 간단하고 확실)
echo -e "${YELLOW}📦 npm 캐시 복사 중...${NC}"
mkdir -p "${DEPENDENCIES_DIR}/npm-cache"
if [ -d "${NPM_CACHE_DIR}" ]; then
    echo -e "${BLUE}캐시 디렉토리에서 패키지 복사 중...${NC}"
    cp -r "${NPM_CACHE_DIR}"/* "${DEPENDENCIES_DIR}/npm-cache/" 2>/dev/null || true
    echo -e "${GREEN}✅ npm 캐시 복사 완료${NC}"
fi

# 방법 2: package-lock.json에서 패키지 목록 추출하여 npm pack으로 다운로드
echo -e "${YELLOW}📦 패키지 파일(.tgz) 다운로드 중...${NC}"
cd "${DEPENDENCIES_DIR}/npm-packages"

# package.json에서 직접 의존성 추출 (더 간단하고 확실)
PACKAGE_LIST=$(node -e "
const fs = require('fs');
const path = require('path');

try {
  const pkgFile = path.join('${PROJECT_DIR}', 'package.json');
  const pkgData = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  const packages = new Set();

  // dependencies와 devDependencies에서 패키지 이름만 추출
  const allDeps = {...(pkgData.dependencies || {}), ...(pkgData.devDependencies || {})};
  
  for (const [name, version] of Object.entries(allDeps)) {
    // 버전 범위 제거 (^, ~, >= 등)
    const cleanVersion = version.replace(/^[\^~>=<]+\s*/, '').split(' ')[0];
    packages.add(\`\${name}@\${cleanVersion}\`);
  }

  console.log(Array.from(packages).sort().join(' '));
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
")

PACK_COUNT=0
TOTAL_PACKAGES=$(echo $PACKAGE_LIST | wc -w)
echo -e "${BLUE}총 ${TOTAL_PACKAGES}개의 직접 의존성 패키지를 다운로드합니다.${NC}"
echo -e "${YELLOW}참고: 하위 의존성은 npm install 시 자동으로 다운로드됩니다.${NC}"

for pkg in $PACKAGE_LIST; do
    # 패키지 이름과 버전 분리
    if [[ "$pkg" =~ ^(.+)@(.+)$ ]]; then
        pkg_name="${BASH_REMATCH[1]}"
        pkg_version="${BASH_REMATCH[2]}"
    else
        echo -e "    ${RED}✗${NC} 잘못된 패키지 형식: ${pkg}"
        continue
    fi
    
    # scoped 패키지 처리 (npm pack 출력 형식)
    if [[ "$pkg_name" == @* ]]; then
        pack_name=$(echo "$pkg_name" | sed 's/@//' | sed 's/\//__/g')
    else
        pack_name="$pkg_name"
    fi
    
    # 이미 다운로드된 패키지 확인
    if ls "${pack_name}-${pkg_version}.tgz" 2>/dev/null | grep -q . || ls "${pack_name}-"*.tgz 2>/dev/null | grep -q .; then
        echo -e "  ${GREEN}✓${NC} ${pkg_name}@${pkg_version} (이미 존재)"
        PACK_COUNT=$((PACK_COUNT + 1))
        continue
    fi
    
    echo -e "  ${YELLOW}⬇${NC}  ${pkg_name}@${pkg_version}"
    
    # npm pack 실행 (버전 범위가 있으면 최신 버전 다운로드)
    if npm pack "${pkg_name}@${pkg_version}" 2>/dev/null || npm pack "${pkg_name}" 2>/dev/null; then
        PACK_COUNT=$((PACK_COUNT + 1))
    else
        echo -e "    ${RED}✗${NC} 다운로드 실패: ${pkg} (수동으로 확인 필요)"
    fi
done

# package-lock.json 복사
echo -e "${YELLOW}📋 package-lock.json 복사 중...${NC}"
cp "${PROJECT_DIR}/package-lock.json" "${DEPENDENCIES_DIR}/npm-packages/" 2>/dev/null || true

# 다운로드 결과 확인
TGZ_COUNT=$(find "${DEPENDENCIES_DIR}/npm-packages" -name "*.tgz" 2>/dev/null | wc -l)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  다운로드 완료${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}패키지 파일 (.tgz): ${TGZ_COUNT}개${NC}"
echo -e "${GREEN}저장 경로: ${DEPENDENCIES_DIR}/npm-packages${NC}"
echo ""

# 필수 패키지 확인
echo -e "${YELLOW}📋 필수 패키지 확인 중...${NC}"
MISSING_PACKAGES=0
REQUIRED_PACKAGES=("react" "react-dom" "vite" "typescript" "antd")

for pkg in "${REQUIRED_PACKAGES[@]}"; do
    if find "${DEPENDENCIES_DIR}/npm-packages" -name "${pkg}*.tgz" 2>/dev/null | grep -q .; then
        echo -e "  ${GREEN}✓${NC} ${pkg}"
    else
        echo -e "  ${RED}✗${NC} ${pkg} - 누락됨!"
        MISSING_PACKAGES=$((MISSING_PACKAGES + 1))
    fi
done

if [ $MISSING_PACKAGES -gt 0 ]; then
    echo ""
    echo -e "${RED}⚠️  경고: ${MISSING_PACKAGES}개의 필수 패키지가 누락되었습니다.${NC}"
    echo -e "${YELLOW}수동으로 다운로드하거나 npm install을 다시 실행하세요.${NC}"
else
    echo -e "${GREEN}✅ 모든 필수 패키지가 다운로드되었습니다.${NC}"
fi

echo ""
echo -e "${YELLOW}다음 단계:${NC}"
echo "  1. 이 디렉토리를 오프라인 환경으로 복사"
echo "  2. 오프라인 환경에서 ./scripts/offline/run-dev-offline.sh 실행"
echo ""
echo -e "${BLUE}참고:${NC}"
echo "  - npm-packages 디렉토리에 .tgz 파일들이 저장됩니다"
echo "  - package-lock.json도 함께 복사됩니다"
echo "  - 오프라인 환경에서는 docker-compose.dev.offline.yml이 이 디렉토리를 참조합니다"
echo ""

