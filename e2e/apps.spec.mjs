import { test, expect } from '@playwright/test';

test('car assessment, validation, comparison, local PNG and restore', async ({
  page,
  context,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173');
  await expect(page.getByRole('heading', { name: /车车很心动/ })).toBeVisible();
  await page.screenshot({
    path: 'test-results/car-desktop.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: '带上钱包，出发' }).click();
  for (let i = 0; i < 6; i++) {
    await page.locator('.option').nth(2).click();
    await page.getByRole('button', { name: '下一站' }).click();
  }
  await page.getByLabel(/每月到手收入/).fill('');
  await page.getByRole('button', { name: '继续，看看车的预算' }).click();
  await expect(page.getByLabel(/每月到手收入/)).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await page.getByLabel(/每月到手收入/).fill('12000');
  await page.getByRole('button', { name: '继续，看看车的预算' }).click();
  await context.setOffline(true);
  await page.getByRole('button', { name: '生成我的体检报告' }).click();
  await expect(page.getByRole('heading', { name: /你是「/ })).toBeVisible();
  await page.getByRole('button', { name: '对比另一个方案' }).click();
  const modal = page.getByRole('dialog');
  await modal.getByLabel(/车辆成交价/).fill('100000');
  await modal.getByRole('button', { name: '更新 B 方案' }).click();
  await expect(
    page.getByRole('heading', { name: 'A / B 方案对比' }),
  ).toBeVisible();
  await expect(page.locator('.comparison-head')).toContainText('B · ¥100000');
  await page.getByRole('button', { name: '分享脱敏结果' }).click();
  await expect(
    page.getByRole('img', { name: '即将分享的卡片预览' }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole('img', { name: '即将分享的卡片预览' })
        .evaluate((img) => img.naturalWidth),
    )
    .toBe(1500);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载 PNG' }).click();
  expect((await download).suggestedFilename()).toBe('fungame-card.png');
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: 'test-results/car-mobile-results.png',
    fullPage: true,
  });
  await context.setOffline(false);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'A / B 方案对比' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('earnings settings, timed lunch, privacy, offline export and responsive scene', async ({
  page,
  context,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-11-05T01:00:00Z') });
  await page.clock.pauseAt(new Date('2026-11-05T01:00:00Z'));
  await page.goto('http://127.0.0.1:4174');
  await page.getByRole('button', { name: '设置我的工资', exact: true }).click();
  await page.getByLabel('工作时区（IANA 名称）').fill('Asia/Shanghai');
  await page.getByLabel('本月计薪日数（留空按日历）').fill('20');
  await page.getByRole('button', { name: '保存，开始我的今天' }).click();
  await expect(page.getByText('正在努力赚钱')).toBeVisible();
  await page.clock.fastForward(3 * 3600000);
  await expect(page.locator('.income-value')).toContainText('187.50');
  await expect(page.getByText('午休中 · 暂停计薪')).toBeVisible();
  await page.clock.fastForward(3600000);
  await expect(page.locator('.income-value')).toContainText('187.50');
  await page.screenshot({
    path: 'test-results/earnings-desktop.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: '隐藏金额', exact: true }).click();
  await expect(page.locator('.income-value')).toContainText('••••••');
  await expect(page.locator('main')).not.toContainText('187.50');
  await page.getByRole('button', { name: '打开设置' }).click();
  await expect(page.getByRole('dialog')).toContainText('仅在本次编辑中显示');
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await context.setOffline(true);
  await page.getByRole('button', { name: '分享今天' }).click();
  await page.getByRole('button', { name: '生成分享预览' }).click();
  await expect(
    page.getByRole('img', { name: '即将分享的卡片预览' }),
  ).toBeVisible();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: 'test-results/earnings-mobile.png',
    fullPage: true,
  });
  await context.setOffline(false);
  await page.reload();
  await expect(page.locator('.income-value')).toContainText('••••••');
  await page.clock.fastForward(5 * 3600000);
  await expect(page.getByText('今日收工', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('320px landing layouts and corrupt storage stay usable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  for (const port of [4173, 4174]) {
    await page.goto(`http://127.0.0.1:${port}`);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await page.evaluate(
      (key) => localStorage.setItem(key, '{bad-data'),
      port === 4173 ? 'fungame:car-fit:v1' : 'fungame:daily-earnings:v1',
    );
    await page.reload();
    await expect(page.getByRole('status')).toContainText('无法读取');
  }
});

test('quota denial degrades to memory without blocking either app', async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };
  });
  await page.goto('http://127.0.0.1:4173');
  await page.getByRole('button', { name: '带上钱包，出发' }).click();
  await page.locator('.option').first().click();
  await expect(page.getByRole('status')).toContainText('未保存');
  await page.getByRole('button', { name: '下一站' }).click();
  await expect(page.locator('.question-index')).toContainText('02');
  await page.goto('http://127.0.0.1:4174');
  await page.getByRole('button', { name: '设置我的工资', exact: true }).click();
  await page.getByRole('button', { name: '保存，开始我的今天' }).click();
  await expect(page.getByRole('status')).toContainText('未保存');
  await expect(page.locator('.income-value')).toBeVisible();
});

test('a natural milestone celebrates once and refresh does not replay it', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-11-05T01:00:00Z') });
  await page.clock.pauseAt(new Date('2026-11-05T01:00:00Z'));
  await page.goto('http://127.0.0.1:4174');
  await page.getByRole('button', { name: '设置我的工资', exact: true }).click();
  await page.getByLabel('按时薪').check();
  await page.getByLabel('时薪 / 元', { exact: true }).fill('3600');
  await page.getByLabel('目标 1 金额').fill('2');
  await page.getByRole('button', { name: '保存，开始我的今天' }).click();
  await page.bringToFront();
  await page.clock.runFor(2100);
  await expect(page.locator('.toast')).toContainText('小目标达成');
  await page.reload();
  await expect(page.locator('.toast')).toHaveCount(0);
  await expect(page.locator('.goal-card').first()).toContainText('赚到了');
});
