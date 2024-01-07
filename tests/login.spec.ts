import { test, expect } from '@playwright/test';
import { describe } from 'node:test';


const url = 'https://a2-ai.github.io/playwright-testing-playground/';

test.beforeEach(async ({ page }) => {
  await page.goto(url);
});

test('page has title', async ({ page }) => {
  await expect(page).toHaveTitle(/Testing Playground/);
});

test('can login as fake-static-server-user', async ({ page }) => {
  await expect(page.getByText('Who am I logged in as? fake-static-server-user')).toBeVisible();
});
