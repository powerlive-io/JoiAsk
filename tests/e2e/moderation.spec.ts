import { test, expect } from './fixtures.js';

test('匿名投稿经后台审核公开后可见，撤回公开后不可见', async ({ page, adminPage, dataset }) => {
  const content = `待审核提问 ${dataset.tag.tag_name}`;
  await page.goto('/');
  await page.getByRole('combobox').filter({ hasText: '选择话题' }).click();
  await page.getByRole('option', { name: `#${dataset.tag.tag_name}`, exact: true }).click();
  await page.getByPlaceholder('输入你的提问...').fill(content);
  await page.getByRole('checkbox', { name: '彩虹屁', exact: true }).check();
  await page.getByRole('button', { name: '提交', exact: true }).click();
  await expect(page.getByText('提问已提交审核，内容将会在审核通过后放出')).toBeVisible();
  await expect(page.getByPlaceholder('输入你的提问...')).toHaveValue('');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ask_content'))).toBe('');
  const questions = await dataset.questions();
  expect(questions).toHaveLength(1);
  expect(questions[0]).toMatchObject({ content, is_publish: false, is_rainbow: true });

  await page.goto('/search/');
  await page.getByPlaceholder('输入搜索内容...').fill(content);
  await page.getByRole('button', { name: '搜索', exact: true }).click();
  await expect(page.getByText('没有找到相关的提问')).toBeVisible();

  await adminPage.goto('/admin/dashboard/questions/');
  const row = adminPage.getByRole('row').filter({ hasText: content });
  await expect(row).toBeVisible();
  await expect(row.getByRole('checkbox', { name: '公开', exact: true })).not.toBeChecked();
  // This controlled checkbox updates only after its API request completes.
  await row.getByRole('checkbox', { name: '公开', exact: true }).click();
  await expect(row.getByRole('checkbox', { name: '公开', exact: true })).toBeChecked();
  await expect.poll(async () => (await dataset.questions())[0].is_publish).toBe(true);
  await page.getByRole('button', { name: '搜索', exact: true }).click();
  await expect(page.getByText(content, { exact: true })).toBeVisible();

  // Reload verifies the change was saved, rather than only toggling local state.
  await adminPage.reload();
  await expect(row.getByRole('checkbox', { name: '公开', exact: true })).toBeChecked();
  await expect(row.getByRole('checkbox', { name: '彩虹屁', exact: true })).toBeChecked();
  await row.getByRole('checkbox', { name: '公开', exact: true }).click();
  await expect(row.getByRole('checkbox', { name: '公开', exact: true })).not.toBeChecked();
  await expect.poll(async () => (await dataset.questions())[0].is_publish).toBe(false);
  await page.getByRole('button', { name: '搜索', exact: true }).click();
  await expect(page.getByText('没有找到相关的提问')).toBeVisible();
  await expect(page.getByText(content, { exact: true })).toHaveCount(0);
});

test('提问可以移入拦截箱、恢复和删除', async ({ adminPage, dataset }) => {
  const content = `拦截箱测试 ${dataset.tag.tag_name}`;
  await dataset.createQuestion(content);
  await adminPage.goto('/admin/dashboard/questions/');
  const row = adminPage.getByRole('row').filter({ hasText: content });
  await row.getByRole('button', { name: '打开操作菜单' }).click();
  await adminPage.getByRole('menuitem', { name: '移到拦截箱' }).click();
  await expect(row).toHaveCount(0);
  await adminPage.getByRole('link', { name: '拦截箱', exact: true }).click();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: '打开操作菜单' }).click();
  await adminPage.getByRole('menuitem', { name: '移入收件箱' }).click();
  await expect(row).toHaveCount(0);
  await adminPage.getByRole('link', { name: '收件箱', exact: true }).click();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: '打开操作菜单' }).click();
  await adminPage.getByRole('menuitem', { name: '删除' }).click();
  const dialog = adminPage.getByRole('dialog');
  await dialog.getByRole('button', { name: '删除', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(row).toHaveCount(0);
  await expect.poll(() => dataset.questions()).toEqual([]);
});
