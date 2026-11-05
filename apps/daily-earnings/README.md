# 今日已赚

首版已实现。月薪 / 时薪、工作日历与午休、实时估算、原创水豚场景、趣味目标、隐私与专注模式、本机分享。

## 运行

在仓库根目录使用 Node.js 24 与 pnpm 11.25.0：

```sh
pnpm install
pnpm --filter daily-earnings dev
```

默认地址：http://localhost:5174 。根目录 `pnpm dev` 可同时启动两个作品。

```sh
pnpm --filter daily-earnings typecheck
pnpm --filter daily-earnings test
pnpm --filter daily-earnings build
pnpm --filter daily-earnings preview
```

`dist/` 可独立静态部署，无环境变量、后端、数据库或业务 API。使用 Vite 的相对资源路径；选择部署子路径时仍需在目标托管环境验证。站点加载后可断网完成计算、修改与图片生成，不承诺离线冷启动。

## 数据与边界

数据仅保存在当前浏览器，清理浏览器、无痕模式或换设备可能丢失。存储不可用时退化为内存会话，页面明确提示。没有账号、云同步、远程统计或自动上传。分享卡由 Canvas 本机生成，默认隐藏财务数据，原生分享不支持时下载 PNG。

工资为根据设备时间、计薪安排与用户输入计算的趣味估算，不代表实际到账。支持日班，暂不支持跨夜班和自动节假日。演示使用虚拟数据，不覆盖正式设置。

## 文档与实现

- [产品设计文档](docs/product-design.md)
- [技术方案](docs/technical-design.md)
- [设计风格要求](docs/design-style.md)
- [公共设计规范](../../docs/design-style.md)

纯计算和 schema 在 `src/domain/`，浏览器存储与图片生成在 `src/platform/`，原创角色和表单在 `src/components/`。首版将原方案中的若干小模块合并为领域文件，保持计算与 UI 分离；两个作品尚未提取公共 UI 包。

## 浏览器验证

根目录执行 `pnpm build`、`pnpm exec playwright install chromium` 后运行 `pnpm test:e2e`。已有系统 Chromium 的环境可设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`，CI 默认使用 Playwright 浏览器。用例覆盖主要流程、断网计算与 PNG 生成、隐私恢复、窄屏布局、损坏记录和存储失败降级。
