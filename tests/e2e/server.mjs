import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adminCredentials, ports } from './environment.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const directory = await mkdtemp(path.join(tmpdir(), 'joiask-e2e-'));
const children = new Set();
let stopping = false;
let server;

function start(command, args, options = {}) {
  const child = spawn(command, args, { cwd: root, stdio: ['pipe', 'inherit', 'inherit'], ...options });
  children.add(child);
  child.once('exit', () => children.delete(child));
  child.once('error', () => children.delete(child));
  return child;
}

async function run(command, args, options, input = '') {
  const child = start(command, args, options);
  child.stdin.end(input);
  const [code] = await once(child, 'exit');
  if (code !== 0) throw new Error(`${command} failed with exit code ${code}`);
}

async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  server?.close();
  const exits = [...children].map(async (child) => {
    const exited = once(child, 'exit');
    child.kill('SIGTERM');
    const timer = setTimeout(() => child.kill('SIGKILL'), 2_000);
    await exited;
    clearTimeout(timer);
  });
  await Promise.all(exits);
  await rm(directory, { recursive: true, force: true });
  process.exit(code);
}

process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());

try {
  const configPath = path.join(directory, 'config.json');
  await writeFile(configPath, JSON.stringify({
    db_type: 'sqlite',
    sqlite: path.join(directory, 'test.db'),
    server: { host: '127.0.0.1', port: ports.backend },
    security: { session_secret: randomBytes(32).toString('hex'), secure_cookie: false },
    storage_type: 'local',
  }), { mode: 0o600 });
  // The backend's local storage path is relative to its working directory.
  await mkdir(path.join(directory, 'frontend/public/upload-img'), { recursive: true });
  const binary = path.join(directory, 'joiask');
  await run('go', ['build', '-o', binary, './cmd']);
  const backendOptions = { cwd: directory, env: { ...process.env, JOIASK_CONFIG: configPath, GIN_MODE: 'release' } };
  await run(binary, ['admin', 'create', adminCredentials.username], backendOptions, `${adminCredentials.password}\n`);
  const backend = start(binary, [], backendOptions);
  backend.once('error', (error) => { console.error(error); void shutdown(1); });
  backend.once('exit', () => { if (!stopping) void shutdown(1); });

  function target(url) {
    if (url.startsWith('/api/')) return ports.backend;
    if (url === '/admin' || url.startsWith('/admin/')) return ports.admin;
    return ports.frontend;
  }

  // Same-origin routing mirrors Caddy without requiring a local Caddy install.
  server = http.createServer((request, response) => {
    const upstream = http.request({
      hostname: '127.0.0.1', port: target(request.url), path: request.url,
      method: request.method, headers: request.headers,
    }, (incoming) => {
      response.writeHead(incoming.statusCode, incoming.headers);
      incoming.pipe(response);
      response.on('close', () => incoming.destroy());
    });
    upstream.on('error', () => {
      if (!response.headersSent) response.writeHead(502);
      response.end('E2E upstream unavailable');
    });
    request.pipe(upstream);
  });
  // Forward the app's WebSocket and Next's HMR connections as well.
  server.on('upgrade', (request, socket, head) => {
    const upstream = http.request({
      hostname: '127.0.0.1', port: target(request.url), path: request.url,
      headers: request.headers,
    });
    upstream.on('upgrade', (response, remote, remoteHead) => {
      socket.write(`HTTP/1.1 ${response.statusCode} ${response.statusMessage}\r\n`);
      for (let i = 0; i < response.rawHeaders.length; i += 2) {
        socket.write(`${response.rawHeaders[i]}: ${response.rawHeaders[i + 1]}\r\n`);
      }
      socket.write('\r\n');
      if (remoteHead.length) socket.write(remoteHead);
      if (head.length) remote.write(head);
      socket.pipe(remote).pipe(socket);
      socket.on('close', () => remote.destroy());
      remote.on('close', () => socket.destroy());
      remote.on('error', () => socket.destroy());
    });
    upstream.on('response', () => socket.destroy());
    upstream.on('error', () => socket.destroy());
    socket.on('error', () => upstream.destroy());
    upstream.end();
  });
  server.listen(ports.proxy, '127.0.0.1');
  await once(server, 'listening');
} catch (error) {
  console.error(error);
  await shutdown(1);
}
