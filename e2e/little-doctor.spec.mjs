import { test, expect } from '@playwright/test';
async function scan(page, name) {
  await page.getByRole('button', { name }).click();
  await expect(page.getByRole('button', { name: '开始习惯任务' })).toBeVisible({
    timeout: 10000,
  });
}
async function complete(page) {
  await page.getByRole('button', { name: '开始习惯任务' }).click();
  for (let i = 1; i <= 3; i++) {
    await page.getByRole('button', { name: `完成第${i}项任务` }).click();
  }
  await expect(
    page.getByRole('button', { name: '完成了，开始复查' }),
  ).toBeDisabled();
  await page.getByLabel('我和家长一起完成了').check();
  await page.getByRole('button', { name: '完成了，开始复查' }).click();
  await expect(page.getByRole('heading', { name: /，完成！/ })).toBeVisible({
    timeout: 10000,
  });
}

test('doctor desktop: eight parts, offline task, reward and daily deduplication', async ({
  page,
  context,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4175');
  await expect(page.getByRole('button', { name: /^选择/ })).toHaveCount(8);
  await page.screenshot({
    path: 'test-results/doctor-desktop.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: '选择小牙齿', exact: true }).click();
  await context.setOffline(true);
  await scan(page, '开始扫描小牙齿');
  await expect(page.getByText('你好，我是泡泡团子')).toBeVisible();
  await complete(page);
  await page.getByRole('button', { name: '查看贴纸' }).click();
  await expect(page.getByRole('dialog')).toContainText('累计 1 张');
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '继续探索' }).click();
  await scan(page, '开始扫描小牙齿');
  await complete(page);
  await page.getByRole('button', { name: '查看贴纸' }).click();
  await expect(page.getByRole('dialog')).toContainText('累计 1 张');
  await context.setOffline(false);
  await page.reload();
  await expect(page.locator('.daily-count')).toContainText('1 / 8');
  expect(errors).toEqual([]);
});

test.describe('doctor H5', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
  });
  test('touch scan, cancel, complete and clear records', async ({ page }) => {
    await page.goto('http://127.0.0.1:4175');
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    await page.getByRole('button', { name: '选择小手', exact: true }).tap();
    await page.screenshot({
      path: 'test-results/doctor-h5.png',
      fullPage: true,
    });
    await page.getByRole('button', { name: '开始扫描小手' }).tap();
    await page.getByRole('button', { name: '取消扫描' }).tap();
    await expect(
      page.getByRole('button', { name: '开始扫描小手' }),
    ).toBeVisible();
    await scan(page, '开始扫描小手');
    await complete(page);
    await page.getByRole('button', { name: '家长说明与设置' }).tap();
    await expect(page.getByRole('dialog')).toContainText('不使用摄像头');
    await page.getByRole('button', { name: '清除本机贴纸' }).tap();
    await page.getByRole('button', { name: '确认清除' }).tap();
    await expect(page.locator('.daily-count')).toContainText('0 / 8');
    await page.setViewportSize({ width: 320, height: 568 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  });
});

test('doctor corrupted storage and reduced motion remain usable', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:4175');
  await page.evaluate(() =>
    localStorage.setItem('fungame:little-doctor:v1', 'bad-json'),
  );
  await page.reload();
  await expect(page.getByRole('status')).toContainText('无法读取');
  await page.getByRole('button', { name: '开始扫描小肚子' }).click();
  await expect(page.getByRole('button', { name: '开始习惯任务' })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.locator('.buddy')).toHaveCSS('animation-name', 'none');
});

test('parent config persists, drives the selected story and stays locked during tasks', async ({
  page,
}) => {
  await page.goto('http://127.0.0.1:4175');
  await page.getByRole('button', { name: '家长说明与设置' }).click();
  const modal = page.getByRole('dialog');
  await modal.getByLabel('配置部位', { exact: true }).selectOption('teeth');
  await modal.getByLabel('习惯场景', { exact: true }).selectOption('sweets');
  await modal.getByLabel('想约定少吃的零食（可选）').fill('棒棒糖、夹心饼干');
  await modal.getByLabel('家长提醒（可选）').fill('今天先吃正餐。');
  await modal.getByRole('button', { name: '保存习惯配置' }).click();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: '选择小牙齿', exact: true }).click();
  await scan(page, '开始扫描小牙齿');
  await expect(
    page.getByRole('heading', { name: '你好，我是甜甜糖虫' }),
  ).toBeVisible();
  await expect(page.locator('.family-plan')).toContainText('棒棒糖、夹心饼干');
  await expect(page.locator('.family-plan')).toContainText('今天先吃正餐。');
  await page.getByRole('button', { name: '家长说明与设置' }).click();
  await expect(page.getByLabel('习惯场景', { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '换一个部位' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '家长说明与设置' }).click();
  await page.getByLabel('配置部位', { exact: true }).selectOption('eyes');
  await page.getByLabel('习惯场景', { exact: true }).selectOption('screen');
  await page.getByRole('button', { name: '保存习惯配置' }).click();
  await expect
    .poll(() =>
      page
        .getByRole('dialog')
        .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
    )
    .toBe(true);
  await page.screenshot({
    path: 'test-results/doctor-parent-config-h5.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('button', { name: '选择小眼睛', exact: true }).click();
  await scan(page, '开始扫描小眼睛');
  await expect(page.getByText('一起完成「给屏幕按个暂停」吧。')).toBeVisible();
  await complete(page);
  await page.getByRole('button', { name: '家长说明与设置' }).click();
  await page.getByLabel('习惯场景', { exact: true }).selectOption('rubbing');
  await page.getByRole('button', { name: '保存习惯配置' }).click();
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '开始扫描小眼睛' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: /，完成！/ })).toHaveCount(0);
});

test('Chinese voice reads start, progress, result and stops when muted on H5', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const log = [];
    let cancelCount = 0;
    const listeners = new Set();
    Object.defineProperty(window, '__voiceTest', {
      value: {
        log,
        get cancels() {
          return cancelCount;
        },
      },
    });
    class MockUtterance {
      constructor(text) {
        this.text = text;
      }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      value: MockUtterance,
      configurable: true,
    });
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        getVoices: () => [
          {
            lang: 'zh-CN',
            name: 'Test local Chinese',
            localService: true,
            default: true,
            voiceURI: 'test',
          },
        ],
        cancel: () => {
          cancelCount++;
        },
        speak: (utterance) => {
          log.push(utterance.text);
          setTimeout(() => utterance.onend?.(), 10);
        },
        addEventListener: (_name, callback) => listeners.add(callback),
        removeEventListener: (_name, callback) => listeners.delete(callback),
      },
      configurable: true,
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4175');
  await page.getByRole('button', { name: '开始扫描小肚子' }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__voiceTest.log.some((text) => text.includes('开始扫描小肚子')),
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__voiceTest.log.some((text) => text.includes('正在扫描')),
      ),
    )
    .toBe(true);
  await expect(page.getByRole('button', { name: '开始习惯任务' })).toBeVisible({
    timeout: 10000,
  });
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__voiceTest.log.some((text) => text.includes('模拟扫描完成')),
      ),
    )
    .toBe(true);
  await page.getByRole('button', { name: '重播语音' }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__voiceTest.log.filter((text) => text.includes('模拟扫描完成'))
            .length,
      ),
    )
    .toBe(2);
  await page.getByRole('button', { name: '开始习惯任务' }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__voiceTest.log.some((text) => text.includes('第3步')),
      ),
    )
    .toBe(true);
  await page.getByRole('button', { name: '关闭语音', exact: true }).click();
  await expect(page.getByRole('button', { name: '重播语音' })).toBeDisabled();
  const count = await page.evaluate(() => window.__voiceTest.log.length);
  await page.reload();
  await expect(
    page.getByRole('button', { name: '开启语音', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '开始扫描小肚子' }).click();
  await expect(page.getByRole('button', { name: '开始习惯任务' })).toBeVisible({
    timeout: 10000,
  });
  expect(await page.evaluate(() => window.__voiceTest.log.length)).toBe(0);
  expect(count).toBeGreaterThan(3);
});
