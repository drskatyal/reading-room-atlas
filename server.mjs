import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'reading-room-atlas' });
});

app.use(
  express.static(distDir, {
    maxAge: '1h',
    setHeaders(res, filePath) {
      if (filePath.endsWith('.nii.gz')) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.removeHeader('Content-Encoding');
      } else if (filePath.endsWith('.glb')) {
        res.setHeader('Content-Type', 'model/gltf-binary');
        res.setHeader('Cache-Control', 'public, max-age=86400');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  })
);

app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ReadingRoom Atlas listening on http://0.0.0.0:${PORT}`);
});
