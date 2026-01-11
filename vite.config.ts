import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // 환경 변수 로드
  const env = loadEnv(mode, process.cwd(), '');
  
  // Docker 컨테이너 내부에서 실행 시 백엔드 컨테이너 이름 사용
  // 호스트에서 실행 시 localhost 사용
  // 환경 변수 VITE_API_PROXY_TARGET이 설정되어 있으면 우선 사용
  const apiProxyTarget = env.VITE_API_PROXY_TARGET 
    || (env.RUN_MODE === 'docker' ? 'http://subwayaiv2-api-web-dev:8001' : 'http://localhost:8001');

  return {
    plugins: [react()],
    cacheDir: '/tmp/vite-cache-subwayaiv2-front', // 사용자 접근 가능한 임시 디렉토리 사용
    server: {
      host: '0.0.0.0',  // Docker 컨테이너에서 외부 접근 허용
      port: 3001,
      strictPort: true,  // 포트가 사용 중이면 에러 발생 (다른 포트로 자동 변경 방지)
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
          ws: true,  // WebSocket 지원
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
    resolve: { alias: { "@": "/src" } },
  };
});
