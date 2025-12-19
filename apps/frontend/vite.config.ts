import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// 빌드 타임스탬프 생성
const buildTimestamp = Date.now().toString();

// version.json 생성 플러그인
const versionPlugin = () => ({
  name: 'version-plugin',
  buildStart() {
    const versionInfo = {
      version: buildTimestamp,
      buildTime: new Date().toISOString(),
    };

    // public 폴더가 없으면 생성
    const publicDir = path.resolve(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(
      path.resolve(publicDir, 'version.json'),
      JSON.stringify(versionInfo, null, 2)
    );
  },
});

export default defineConfig({
  plugins: [react(), versionPlugin()],
  define: {
    __BUILD_VERSION__: JSON.stringify(buildTimestamp),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
      },
    },
  },
});
