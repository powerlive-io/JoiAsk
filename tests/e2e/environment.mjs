// These credentials belong only to the disposable E2E database.
export const adminCredentials = { username: 'e2e-admin', password: 'e2e-only-password' };
const port = Number(process.env.E2E_PORT || 14820);
if (!Number.isInteger(port) || port < 1024 || port > 65532) {
  throw new Error('E2E_PORT must be an integer between 1024 and 65532');
}
export const ports = { proxy: port, backend: port + 1, frontend: port + 2, admin: port + 3 };
export const baseURL = `http://127.0.0.1:${ports.proxy}`;
