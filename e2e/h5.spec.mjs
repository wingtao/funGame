import { test, expect } from '@playwright/test';
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});
async function noOverflow(page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
}
test('H5 car: touch questionnaire, budget, comparison and image preview', async ({
  page,
  context,
}) => {
  await page.goto('http://127.0.0.1:4173');
  await page.getByRole('button', { name: '带上钱包，出发' }).tap();
  for (let i = 0; i < 6; i++) {
    await page.locator('.option').nth(2).tap();
    await page.getByRole('button', { name: '下一站' }).tap();
  }
  await noOverflow(page);
  await expect(page.getByLabel(/每月到手收入/)).toHaveCSS('font-size', '16px');
  await page.getByLabel(/每月到手收入/).fill('15000');
  await page.getByRole('button', { name: '继续，看看车的预算' }).tap();
  await page.getByRole('button', { name: '生成我的体检报告' }).tap();
  await page.getByRole('button', { name: '对比另一个方案' }).tap();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/车辆成交价/).fill('100000');
  await dialog.getByRole('button', { name: '更新 B 方案' }).tap();
  await expect(
    page.getByRole('heading', { name: 'A / B 方案对比' }),
  ).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: 'test-results/car-h5.png', fullPage: true });
  await context.setOffline(true);
  await page.getByRole('button', { name: '分享脱敏结果' }).tap();
  await expect
    .poll(() =>
      page
        .getByRole('img', { name: '即将分享的卡片预览' })
        .evaluate((img) => img.naturalWidth),
    )
    .toBe(1500);
  await page.getByRole('button', { name: '关闭', exact: true }).tap();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});
test('H5 earnings: settings, short viewport, privacy and local share', async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date('2026-11-05T06:00:00Z') });
  await page.clock.pauseAt(new Date('2026-11-05T06:00:00Z'));
  await page.goto('http://127.0.0.1:4174');
  await page.getByRole('button', { name: '设置我的工资', exact: true }).tap();
  await expect(page.getByLabel('月薪 / 元')).toHaveCSS('font-size', '16px');
  await page.setViewportSize({ width: 390, height: 420 });
  await page.getByLabel('月薪 / 元').fill('12000');
  await page.getByRole('button', { name: '保存，开始我的今天' }).tap();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole('heading', { name: '今日收入', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '隐藏金额', exact: true }).tap();
  await expect(page.locator('.income-value')).toContainText('••••••');
  await noOverflow(page);
  await page.screenshot({
    path: 'test-results/earnings-h5.png',
    fullPage: true,
  });
  await context.setOffline(true);
  await page.getByRole('button', { name: '分享今天' }).tap();
  await page.getByRole('button', { name: '生成分享预览' }).tap();
  await expect
    .poll(() =>
      page
        .getByRole('img', { name: '即将分享的卡片预览' })
        .evaluate((img) => img.naturalWidth),
    )
    .toBe(1500);
  await page.getByRole('button', { name: '关闭', exact: true }).tap();
  await page.getByRole('button', { name: '打开设置' }).tap();
  await expect(page.getByRole('dialog')).toContainText('仅在本次编辑中显示');
  await page.getByRole('button', { name: '关闭', exact: true }).tap();
});
test('H5 320px forms do not overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('http://127.0.0.1:4174');
  await page.getByRole('button', { name: '设置我的工资', exact: true }).tap();
  await expect
    .poll(() =>
      page
        .getByRole('dialog')
        .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
    )
    .toBe(true);
  await noOverflow(page);
  await page.getByRole('button', { name: '关闭', exact: true }).tap();
  await page.goto('http://127.0.0.1:4173');
  await noOverflow(page);
});
