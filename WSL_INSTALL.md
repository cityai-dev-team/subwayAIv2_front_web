# WSL 우분투 Node.js/npm 설치 가이드

프로젝트에서 사용하는 Node.js 및 npm 버전을 WSL 우분투에 설치하는 방법입니다.

## 현재 설치된 버전

- **Node.js**: v22.21.0
- **npm**: 11.7.0

## 프로젝트 요구사항

- **Node.js**: 20.x LTS (권장: 20.18.0 이상)
- **npm**: 10.x (Node.js 20에 포함)

> ⚠️ 현재 Node.js 22가 설치되어 있습니다. 프로젝트는 Node.js 20을 사용하므로 버전을 맞춰야 합니다.

## 설치 방법

### 방법 1: nvm 사용 (권장 - 여러 버전 관리 가능)

```bash
# nvm 설치 (아직 설치되지 않은 경우)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

# 터미널 재시작 또는 다음 명령 실행
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Node.js 20 LTS 설치
nvm install 20

# Node.js 20 사용
nvm use 20

# 기본 버전을 20으로 설정 (선택사항)
nvm alias default 20

# 설치 확인
node --version  # v20.x.x 출력되어야 함
npm --version   # 10.x.x 출력되어야 함
```

### 방법 2: NodeSource 저장소 사용 (완전 교체)

```bash
# 현재 Node.js 22 제거
sudo apt remove nodejs npm -y
sudo apt autoremove -y

# NodeSource 저장소 추가
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js 20 LTS 설치
sudo apt-get install -y nodejs

# 설치 확인
node --version  # v20.x.x 출력되어야 함
npm --version   # 10.x.x 출력되어야 함
```


## 설치 확인

```bash
# 버전 확인
node --version
npm --version

# 예상 출력:
# v20.18.0 (또는 그 이상)
# 10.8.2 (또는 그 이상)
```

## 프로젝트 설정

설치 완료 후 프로젝트 디렉토리에서:

```bash
cd subwayAIv2_front_web

# 의존성 설치
npm install

# 개발 서버 실행 (로컬)
npm run dev

# 또는 Docker 사용
make dev-up
```

## 문제 해결

### 권한 오류 발생시

```bash
# npm 전역 패키지 디렉토리 권한 설정
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 현재 Node.js 22에서 20으로 다운그레이드

**nvm이 이미 설치되어 있는 경우:**
```bash
# nvm 활성화
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Node.js 20 설치 및 사용
nvm install 20
nvm use 20
nvm alias default 20

# 확인
node --version  # v20.x.x
```

**nvm이 없는 경우 (apt로 설치된 경우):**
```bash
# 현재 버전 확인
node --version  # v22.21.0

# Node.js 22 제거
sudo apt remove nodejs npm -y
sudo apt autoremove -y

# NodeSource 저장소 추가 및 Node.js 20 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 확인
node --version  # v20.x.x
npm --version   # 10.x.x
```

## 참고

- Docker를 사용하는 경우 호스트의 Node.js 버전은 중요하지 않습니다 (컨테이너 내부에서 `node:20-alpine` 사용)
- 로컬 개발을 위해서만 호스트에 Node.js 설치가 필요합니다
- 프로덕션 빌드는 Docker 컨테이너 내에서 수행됩니다

