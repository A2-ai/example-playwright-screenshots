import { test, expect } from '@playwright/test';
import { describe } from 'node:test';
import { Screenshotter } from '../src/screenshotter/screenshot';
import * as path from 'path';
// log the current working directory

const url = 'https://a2-ai.github.io/playwright-testing-playground/';

const screenshot = new Screenshotter('clickable-elements', path.join(process.cwd(),'/screenshots'));
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(url,{waitUntil: 'networkidle'});
});
 
// https://playwrightsolutions.com/what-the-hex-or-how-i-check-colors-with-playwright/
describe('can select sets of elements', () => {
  test('can select a single element', async ({ page }) => {
    await screenshot.storeScreenshot(page, true);
    const element = await page.getByTestId('item1');
    await expect(element).toHaveCSS('background-color', 'rgb(236, 236, 236)');
    await element.click();
    // you must await this, otherwise the browser will have been closed by the
    // time you're querying this
    await expect(element).toHaveCSS('background-color', 'rgb(173, 216, 230)');
    let startTime = new Date();
    await screenshot.storeScreenshot(page);
    await screenshot.saveStoredScreenshots();
  });

  test('can select multiple elements', async ({ page }) => {
    const element1 = await page.getByTestId('item1');
    const element2 = await page.getByTestId('item2');
    const element3 = await page.getByTestId('item3');

    [element1, element2, element3].forEach(async (element) => {
      await expect(element).toHaveCSS('background-color', 'rgb(236, 236, 236)');
    });

    await element1.click();
    await element3.click();
    [element1, element3].forEach(async (element) => {
      await expect(element).toHaveCSS('background-color', 'rgb(173, 216, 230)');
    })
    await expect(element2).toHaveCSS('background-color', 'rgb(236, 236, 236)');
  });
});