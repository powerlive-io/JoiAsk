import { randomUUID } from 'node:crypto';
import { test as base, expect, type APIRequestContext, type APIResponse, type Page } from '@playwright/test';
import { adminCredentials } from './environment.mjs';

type Tag = { id: number; tag_name: string; description: string };
type Question = {
  id: number; tag_id: number; content: string;
  is_hide: boolean; is_publish: boolean; is_archive: boolean; is_rainbow: boolean;
};
type QuestionFlags = Partial<Pick<Question, 'is_publish' | 'is_archive' | 'is_rainbow'>>;

export async function apiData<T = unknown>(pending: Promise<APIResponse>): Promise<T> {
  const response = await pending;
  expect(response.ok(), `${response.status()} ${response.url()}`).toBeTruthy();
  const body = await response.json();
  expect(body.code, body.message).toBe(200);
  return body.data as T;
}

export async function loginAdmin(page: Page) {
  await page.goto('/admin/');
  await page.getByLabel('用户名', { exact: true }).fill(adminCredentials.username);
  await page.getByLabel('密码', { exact: true }).fill(adminCredentials.password);
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard\/$/);
  await expect(page.getByRole('button', { name: '注销' })).toBeVisible();
}

type Dataset = {
  tag: Tag;
  createTag: (name?: string) => Promise<Tag>;
  questions: (tag?: Tag) => Promise<Question[]>;
  createQuestion: (content: string, flags?: QuestionFlags, tag?: Tag) => Promise<Question>;
};

export const test = base.extend<{
  adminApi: APIRequestContext;
  adminPage: Page;
  dataset: Dataset;
}>({
  // Keep administrator cookies out of the visitor's page/request fixtures.
  adminApi: async ({ playwright, baseURL }, use) => {
    const api = await playwright.request.newContext({ baseURL });
    try {
      await apiData(api.post('/api/login', { data: adminCredentials }));
      await use(api);
    } finally {
      await api.dispose();
    }
  },
  adminPage: async ({ browser, adminApi, baseURL }, use) => {
    const context = await browser.newContext({ baseURL, storageState: await adminApi.storageState() });
    try {
      await use(await context.newPage());
    } finally {
      await context.close();
    }
  },
  dataset: async ({ adminApi, request }, use) => {
    const tags: Tag[] = [];
    const createTag = async (name = `E2E-${randomUUID().slice(0, 8)}`) => {
      const tag = await apiData<Tag>(adminApi.post('/api/tag', {
        data: { tag_name: name, description: '浏览器测试专用话题' },
      }));
      tags.push(tag);
      return tag;
    };
    const questions = async (tag: Tag) => {
      const data = await apiData<{ questions: Question[] }>(adminApi.get('/api/question', {
        params: { tag_id: tag.id, page_size: 100 },
      }));
      return data.questions || [];
    };
    const tag = await createTag();
    try {
      await use({
        tag,
        createTag,
        questions: (selected = tag) => questions(selected),
        createQuestion: async (content, flags = {}, selected = tag) => {
          await apiData(request.post('/api/question', {
            multipart: { tag_id: String(selected.id), content },
          }));
          const question = (await questions(selected)).find((item) => item.content === content);
          expect(question, 'created question is stored in the backend').toBeDefined();
          const updated = { ...question!, ...flags };
          await apiData(adminApi.put(`/api/question/${updated.id}`, { data: updated }));
          return updated;
        },
      });
    } finally {
      // Includes questions submitted through the UI, even after a failed assertion.
      for (const selected of tags) {
        for (const question of await questions(selected)) {
          await apiData(adminApi.delete(`/api/question/${question.id}`));
        }
        await apiData(adminApi.delete(`/api/tag/${selected.id}`));
      }
    }
  },
});

export { expect };
