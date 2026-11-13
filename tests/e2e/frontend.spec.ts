import { test, expect, apiData } from './fixtures.js';

test('草稿刷新后保留，空内容和未选话题不能提交', async ({ page }) => {
  await page.goto('/');
  const content = page.getByPlaceholder('输入你的提问...');
  await expect(content).toBeVisible();

  const emptyDialog = page.waitForEvent('dialog').then(async (dialog) => {
    const message = dialog.message();
    await dialog.accept();
    return message;
  });
  await page.getByRole('button', { name: '提交', exact: true }).click();
  expect(await emptyDialog).toBe('请输入有效的提问内容');

  await content.fill('刷新后继续编辑的草稿');
  await page.reload();
  await expect(content).toHaveValue('刷新后继续编辑的草稿');
  const tagDialog = page.waitForEvent('dialog').then(async (dialog) => {
    const message = dialog.message();
    await dialog.accept();
    return message;
  });
  await page.getByRole('button', { name: '提交', exact: true }).click();
  expect(await tagDialog).toBe('请选择话题');
  await expect(page.getByRole('checkbox', { name: '实名投稿（需登录）' })).toBeDisabled();
});

test('投稿预览支持格式标签和键盘显示隐藏内容', async ({ page, dataset }) => {
  await page.goto('/');
  await page.getByRole('combobox').filter({ hasText: '选择话题' }).click();
  await page.getByRole('option', { name: `#${dataset.tag.tag_name}`, exact: true }).click();
  await page.getByPlaceholder('输入你的提问...').fill('[bold]加粗预览[/bold] [hide]隐藏预览[/hide]');
  await expect(page.locator('strong').filter({ hasText: '加粗预览' })).toBeVisible();
  const hidden = page.getByRole('button', { name: '隐藏内容，点击显示', exact: true });
  await expect(hidden).toHaveAttribute('aria-pressed', 'false');
  await hidden.focus();
  await page.keyboard.press('Enter');
  const revealed = page.getByRole('button', { name: '隐藏内容已显示，点击重新遮挡' });
  await expect(revealed).toHaveAttribute('aria-pressed', 'true');
  await revealed.press('Space');
  await expect(hidden).toHaveAttribute('aria-pressed', 'false');
});

test('搜索支持关键词、话题过滤及空结果', async ({ page, dataset }) => {
  const other = await dataset.createTag();
  await dataset.createQuestion('搜索样本：目标话题', { is_publish: true });
  await dataset.createQuestion('搜索样本：其他话题', { is_publish: true }, other);
  await dataset.createQuestion('搜索样本：尚未审核');
  await page.goto('/search/');
  const input = page.getByPlaceholder('输入搜索内容...');
  await input.fill('搜索样本');
  await input.press('Enter');
  await expect(page.getByText('搜索样本：目标话题', { exact: true })).toBeVisible();
  await expect(page.getByText('搜索样本：其他话题', { exact: true })).toBeVisible();
  await expect(page.getByText('搜索样本：尚未审核', { exact: true })).toHaveCount(0);

  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: `#${dataset.tag.tag_name}`, exact: true }).click();
  const filtered = page.waitForResponse((response) => response.url().includes('/api/question?') && response.url().includes(`tag_id=${dataset.tag.id}`));
  await page.getByRole('button', { name: '搜索', exact: true }).click();
  await filtered;
  await expect(page.getByText('搜索样本：其他话题', { exact: true })).toHaveCount(0);
  await expect(page.getByText('搜索样本：目标话题', { exact: true })).toBeVisible();

  await input.fill('不存在的关键词');
  await input.press('Enter');
  await expect(page.getByText('没有找到相关的提问')).toBeVisible();
  await expect(page.getByText('搜索样本：目标话题', { exact: true })).toHaveCount(0);
});

test('话题详情可以隐藏归档，彩虹屁页面只显示彩虹投稿', async ({ page, dataset }) => {
  await dataset.createQuestion('普通公开提问', { is_publish: true });
  await dataset.createQuestion('已归档公开提问', { is_publish: true, is_archive: true });
  await dataset.createQuestion('彩虹公开提问', { is_publish: true, is_rainbow: true });
  await page.goto('/tags/');
  await page.getByRole('link', { name: `#${dataset.tag.tag_name}`, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/tags/detail/\\?id=${dataset.tag.id}&`));
  await expect(page.getByText('普通公开提问', { exact: true })).toBeVisible();
  await expect(page.getByText('已归档公开提问', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: '隐藏归档卡片' }).check();
  await expect(page.getByText('已归档公开提问', { exact: true })).toHaveCount(0);
  await expect(page.getByText('普通公开提问', { exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: '隐藏归档卡片' }).uncheck();
  await expect(page.getByText('已归档公开提问', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: '彩虹屁', exact: true }).click();
  await expect(page.getByText('彩虹公开提问', { exact: true })).toBeVisible();
  await expect(page.getByText('普通公开提问', { exact: true })).toHaveCount(0);
  await expect(page.getByText('已归档公开提问', { exact: true })).toHaveCount(0);
});

test('开启验证要求后匿名投稿引导登录并保留草稿', async ({ page, adminApi }) => {
  const original = await apiData<{ require_verified_user_to_post: boolean }>(adminApi.get('/api/config'));
  try {
    await apiData(adminApi.put('/api/config', { data: { require_verified_user_to_post: true } }));
    await page.goto('/');
    await page.getByPlaceholder('输入你的提问...').fill('等待登录后提交的草稿');
    await page.getByRole('button', { name: '登录后提交', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').locator('button[type="submit"]')).toHaveText('登录');
    await expect(page.getByPlaceholder('输入你的提问...')).toHaveValue('等待登录后提交的草稿');
  } finally {
    await apiData(adminApi.put('/api/config', {
      data: { require_verified_user_to_post: original.require_verified_user_to_post },
    }));
  }
});
