import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { localBridgePlugin } from './bridge/local-bridge.js';

const appRoot = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

function stageOfflineOcrAssets(): void {
  const workerEntry = require.resolve('tesseract.js');
  const tesseractRoot = resolve(dirname(workerEntry), '..');
  const coreEntry = require.resolve('tesseract.js-core', { paths: [dirname(workerEntry)] });
  const coreRoot = dirname(coreEntry);
  const publicOcr = resolve(appRoot, 'public/ocr');
  const publicCore = resolve(publicOcr, 'core');
  const publicLanguage = resolve(publicOcr, 'lang');
  mkdirSync(publicCore, { recursive: true });
  mkdirSync(publicLanguage, { recursive: true });
  copyFileSync(resolve(tesseractRoot, 'dist/worker.min.js'), resolve(publicOcr, 'worker.min.js'));
  for (const file of ['tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm']) {
    copyFileSync(resolve(coreRoot, file), resolve(publicCore, file));
  }
  for (const language of ['ell', 'eng']) {
    const entry = require.resolve(`@tesseract.js-data/${language}`);
    const packageRoot = dirname(entry);
    copyFileSync(
      resolve(packageRoot, '4.0.0_best_int', `${language}.traineddata.gz`),
      resolve(publicLanguage, `${language}.traineddata.gz`),
    );
  }
}

stageOfflineOcrAssets();

export default defineConfig({
  plugins: [react(), localBridgePlugin()],
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  preview: {
    host: '127.0.0.1',
  },
});
