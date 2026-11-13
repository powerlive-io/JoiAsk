import { randomUUID } from 'node:crypto';
import { test, expect, apiData } from './fixtures.js';

test('话题创建校验、编辑和删除同步到前台', async ({ adminPage, page, adminApi }) => {
  const name = `浏览器话题-${randomUUID().slice(0, 8)}`;
  const renamed = `${name}-已编辑`;
  try {
    await adminPage.goto('/admin/dashboard/tags/');
    await adminPage.getByRole('button', { name: '添加话题', exact: true }).click();
    const dialog = adminPage.getByRole('dialog');
    await dialog.getByRole('button', { name: '添加', exact: true }).click();
    await expect(dialog.getByText('话题名不能为空')).toBeVisible();
    await dialog.getByLabel('话题名', { exact: true }).fill(name);
    await dialog.getByLabel('描述', { exact: true }).fill('新话题描述');
    await dialog.getByRole('button', { name: '添加', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(adminPage.getByRole('row').filter({ hasText: name })).toBeVisible();

    await adminPage.getByRole('button', { name: `编辑话题 ${name}`, exact: true }).click();
    await dialog.getByLabel('话题名', { exact: true }).fill(renamed);
    await dialog.getByLabel('描述', { exact: true }).fill('编辑后的话题描述');
    await dialog.getByRole('button', { name: '保存', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await page.goto('/tags/');
    await expect(page.getByRole('link', { name: `#${renamed}`, exact: true })).toBeVisible();
    await expect(page.getByText('编辑后的话题描述', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: `#${name}`, exact: true })).toHaveCount(0);

    await adminPage.getByRole('button', { name: `删除话题 ${renamed}`, exact: true }).click();
    await dialog.getByRole('button', { name: '取消', exact: true }).click();
    await expect(adminPage.getByRole('row').filter({ hasText: renamed })).toBeVisible();
    await adminPage.getByRole('button', { name: `删除话题 ${renamed}`, exact: true }).click();
    await dialog.getByRole('button', { name: '删除', exact: true }).click();
    await expect(adminPage.getByRole('row').filter({ hasText: renamed })).toHaveCount(0);
    await page.reload();
    // Wait for the list to load before asserting an absent item.
    await expect(page.getByRole('link', { name: '#提问箱', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: `#${renamed}`, exact: true })).toHaveCount(0);
  } finally {
    const tags = await apiData<{ id: number; tag_name: string }[]>(adminApi.get('/api/tag'));
    for (const tag of tags.filter((item) => [name, renamed].includes(item.tag_name))) {
      await apiData(adminApi.delete(`/api/tag/${tag.id}`));
    }
  }
});
