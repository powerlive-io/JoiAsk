import { test, expect, loginAdmin } from './fixtures.js';
import { adminCredentials } from './environment.mjs';

test('未登录访问管理页面会返回登录页', async ({ page }) => {
  await page.goto('/admin/dashboard/questions/');
  await expect(page).toHaveURL(/\/admin\/$/);
  await expect(page.getByRole('button', { name: '登录', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '收件箱' })).toHaveCount(0);
});

test('错误密码提示、登录会话持久化与注销', async ({ page }) => {
  await page.goto('/admin/');
  await page.getByLabel('用户名', { exact: true }).fill(adminCredentials.username);
  await page.getByLabel('密码', { exact: true }).fill('incorrect-password');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.getByText('用户名或密码错误', { exact: true })).toBeVisible();

  await loginAdmin(page);
  await page.reload();
  await expect(page.getByRole('button', { name: '注销' })).toBeVisible();
  await page.getByRole('button', { name: '注销' }).click();
  await expect(page).toHaveURL(/\/admin\/$/);
  await page.goto('/admin/dashboard/');
  await expect(page).toHaveURL(/\/admin\/$/);
});
