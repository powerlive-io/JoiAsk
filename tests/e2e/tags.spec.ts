import { randomUUID } from 'node:crypto';
import { test, expect, apiData } from './fixtures.js';

const topics = [
  { id: 1, tag_name: '提问箱', description: '', question_count: 0 },
  { id: 2, tag_name: '听众来信 & # / ? +', description: '听众的问题', question_count: 7 },
  { id: 3, tag_name: '幕后手记', description: '', question_count: 2 },
];

test('随机抽取不同的话题明信片，目录顺序不变', async ({ page }) => {
  await page.route('**/api/tag', async (route) => {
    // Control the draw after hydration, not the IDs React generates at startup.
    await page.evaluate(() => { Math.random = () => 0.99; });
    await route.fulfill({ json: { code: 200, data: topics } });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tags/');

  const directory = page.getByRole('region', { name: '全部话题' });
  const entries = directory.getByRole('heading', { level: 3 });
  const names = topics.map((tag) => `#${tag.tag_name}`);
  const featured = page.getByRole('complementary', { name: '话题明信片' }).getByRole('heading');
  const draw = page.getByRole('button', { name: '随机一张', exact: true });
  await expect(entries).toHaveText(names);
  await expect(featured).toHaveText(names[2]);
  await draw.focus();
  await draw.press('Enter');
  await expect(featured).toHaveText(names[1]);
  await expect(draw).toBeFocused();

  await page.evaluate(() => { Math.random = () => 0; });
  await draw.click();
  await expect(featured).toHaveText(names[2]);
  await draw.click();
  await expect(featured).toHaveText(names[0]);
  await draw.click();
  await expect(entries).toHaveText(names);

  const tag = topics[1];
  const postcard = page.getByRole('link', { name: `进入话题 #${tag.tag_name}`, exact: true });
  await expect(postcard).toContainText('7 封投稿');
  await postcard.click();
  await expect(page).toHaveURL((url) => url.pathname === '/tags/detail/' &&
    url.searchParams.get('id') === String(tag.id) && url.searchParams.get('name') === tag.tag_name);
});

test('话题搜索包含当前明信片，按名称优先于描述定位结果', async ({ page }) => {
  const tags = [
    { ...topics[0], description: 'Studio 的幕后花絮' },
    { ...topics[1], tag_name: 'Studio 来信 & 问答' },
    topics[2],
  ];
  await page.route('**/api/tag', (route) => route.fulfill({ json: { code: 200, data: tags } }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tags/');
  const search = page.getByRole('searchbox', { name: '搜索话题' });
  await expect(search).toBeInViewport();
  const deck = page.getByRole('complementary', { name: '话题明信片' });
  const featured = await deck.getByRole('heading').innerText();
  const results = page.getByRole('region', { name: '搜索结果' });
  await search.fill(featured);
  await expect(results.getByRole('link', { name: featured, exact: true })).toBeVisible();
  await search.fill('  ｓＴＵＤｉｏ  ');
  await expect(results.getByRole('heading', { level: 3 })).toHaveText(['#Studio 来信 & 问答', '#提问箱']);
  await expect(results.getByRole('status')).toHaveText('找到 2 个话题');
  await expect(deck).toHaveCount(0);
  await expect(page.getByRole('button', { name: '随机一张' })).toHaveCount(0);

  await search.fill('未收录的话题');
  await expect(results.getByText('没有找到匹配的话题')).toBeVisible();
  await results.getByRole('button', { name: '查看全部话题' }).click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('');
  await expect(deck.getByRole('heading')).toHaveText(featured);
  await expect(page.getByRole('region', { name: '全部话题' }).getByRole('link')).toHaveCount(tags.length);
  await search.fill('＃提问');
  await expect(results.getByRole('link')).toHaveCount(1);
  await page.getByRole('button', { name: '清除搜索' }).click();
  await expect(search).toBeFocused();

  await search.fill('来信');
  await results.getByRole('link', { name: '#Studio 来信 & 问答', exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === '/tags/detail/' &&
    url.searchParams.get('id') === String(tags[1].id) && url.searchParams.get('name') === tags[1].tag_name);
});

test('话题加载失败后可重试，空话题和单话题不显示抽卡按钮', async ({ page }) => {
  let response: 'error' | 'empty' | 'single' = 'error';
  await page.route('**/api/tag', (route) => response === 'error' ? route.abort() : route.fulfill({
    json: { code: 200, data: response === 'empty' ? [] : topics.slice(0, 1) },
  }));
  await page.goto('/tags/');
  await expect(page.getByRole('status')).toHaveText('话题加载失败');
  response = 'empty';
  await page.getByRole('button', { name: '重新加载' }).click();
  await expect(page.getByRole('status')).toHaveText('暂时没有话题');
  const draw = page.getByRole('button', { name: '随机一张' });
  await expect(draw).toHaveCount(0);

  response = 'single';
  await page.reload();
  await expect(page.getByRole('link', { name: '#提问箱' })).toContainText('0 封投稿');
  await expect(draw).toHaveCount(0);
  await expect(page.getByRole('region', { name: '全部话题' }).getByRole('link')).toHaveCount(1);
});

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
    const topic = page.getByRole('link', { name: `#${renamed}`, exact: true });
    await expect(topic).toBeVisible();
    await expect(topic.getByText('编辑后的话题描述', { exact: true })).toBeVisible();
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
