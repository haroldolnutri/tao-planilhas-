import http from 'node:http';
import { readFile } from 'node:fs/promises';
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const page = new URL('../index.html', import.meta.url);
http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
  }
  if (!['/', '/index.html', '/Tao%20performance-(2).html'].includes(path)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Página não encontrada'); return;
  }
  try {
    const html = await readFile(page);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : html);
  } catch (error) {
    console.error(error);
    res.writeHead(500); res.end('Não foi possível carregar a página');
  }
}).listen(port, host, () => console.log(`TAO Planilhas: http://${host}:${port}`));
