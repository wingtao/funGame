# FunGame

小游戏、小网站与浏览器插件的多项目工作区。每个作品位于 `apps/<name>`，拥有独立依赖、环境变量、开发服务和构建输出。

## 环境与开始

使用 Node.js 24 LTS（最低 22.12）和 pnpm 11.25.0。可通过 `npm install -g pnpm@11.25.0` 安装 pnpm。

```sh
pnpm install
pnpm new react-site my-site
pnpm install
pnpm --filter my-site dev
```

创建其他类型：

```sh
pnpm new phaser-game my-game
pnpm new wxt-extension my-extension
```

## 目录

- `apps/`：独立作品；当前包含可独立运行的买车测评与今日已赚，以及对应产品、技术和风格文档。
- `templates/react-site/`：React + Vite + Tailwind CSS 4，预置 shadcn 风格 Button、Radix Slot、Lucide 与组件生成配置。
- `templates/phaser-game/`：React + Vite + Phaser，包含可交互的点击得分示例。
- `templates/wxt-extension/`：WXT + React，Manifest V3，包含弹窗示例。
- `packages/config-typescript/`：共享严格 TypeScript 配置。
- `packages/config-eslint/`：共享 ESLint 配置。
- `scripts/`：新作品创建工具。

模板也加入工作区，参与构建与类型检查；创建工具自动排除依赖和构建产物。共享包以源码形式使用，无需单独构建。

## 常用命令

```sh
pnpm --filter my-site dev        # 启动单个作品
pnpm --filter my-site build      # 独立构建
pnpm dev                        # 同时启动 apps 下所有作品，注意端口冲突
pnpm build                      # 构建所有作品及模板
pnpm check                      # ESLint、类型与格式检查
pnpm format                     # 格式化
```

网站和游戏的 `dist/` 可分别部署至静态托管平台。插件使用 `.output/chrome-mv3/` 加载到 Chrome；使用 `build:firefox` 构建 Firefox 版本。工作区共享一个锁文件，部署平台应从仓库根目录安装依赖，再筛选作品构建。

## 选型与约定

- 以 TypeScript 为主。首批买车测评、今日已赚必须为纯前端静态网站：计算与分享图片在本机完成，localStorage 保存设置，不依赖后端、数据库、云同步或远程计算接口。其他作品如确有服务端需求，再单独确定架构。
- 默认网站组件方案为 shadcn/ui + Radix。可在具体作品目录执行 `pnpm dlx shadcn@latest add dialog` 等命令。Mantine、Ant Design、React Aria、DaisyUI 由各作品按需选用。
- 动画按需选 Motion；图表选 Recharts / ECharts；拖拽选 dnd-kit；音效选 Howler.js；自定义 2D 渲染选 PixiJS，3D 选 Three.js + React Three Fiber。
- 简单游戏直接用 React / Canvas，复杂 2D 游戏使用 Phaser。
- 状态先用 React，复杂后再考虑 Zustand。公共 UI 和工具在出现实际复用需求后提取。
- Vitest 用于关键逻辑，Playwright 用于核心操作流程，有需要时安装到对应作品。
- 子项目使用小写短横线名称。新项目完成后维护自己的 README 和 `.env.example`，不提交密钥。

## TypeScript 与 Lint 规范

业务代码默认使用 TypeScript。规则和示例见 [代码质量规范](docs/code-quality.md)。使用 `pnpm lint:fix` 自动修复，`pnpm check` 执行与 CI 相同的检查。

## 设计风格规范

买车测评采用手绘贴纸风，今日已赚采用温暖二维打工小剧场。配色、角色、布局、动效、文案及验收要求见 [设计风格规范](docs/design-style.md)。

## 首批作品

| 作品           | 产品方案                                               | 设计风格                                                       | 状态       |
| -------------- | ------------------------------------------------------ | -------------------------------------------------------------- | ---------- |
| 买车前，先算算 | [产品设计](apps/car-fit/docs/product-design.md)        | [手绘贴纸风](apps/car-fit/docs/design-style.md)                | 首版可运行 |
| 今日已赚       | [产品设计](apps/daily-earnings/docs/product-design.md) | [温暖二维打工小剧场](apps/daily-earnings/docs/design-style.md) | 首版可运行 |

运行 `pnpm dev` 同时启动各作品：买车测评 http://localhost:5173，今日已赚 http://localhost:5174，身体探险队 http://localhost:5175。各作品的运行与部署说明见对应 README。

## 技术方案

首批作品遵循 [纯前端技术基线](docs/frontend-architecture.md)。具体实施方案：[买车测评](apps/car-fit/docs/technical-design.md) · [今日已赚](apps/daily-earnings/docs/technical-design.md)。

## 验证首批作品

```sh
pnpm check
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

端到端测试运行构建后的静态站点，覆盖问答、预算对比、工资计时、隐私、断网分享与本机存储降级。CI 执行相同检查；已有系统 Chromium 时可设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 指定路径。

## 身体探险队

新增 PC / H5 亲子模拟扫描小游戏：[运行说明](apps/little-doctor/README.md) · [产品设计](apps/little-doctor/docs/product-design.md) · [技术方案](apps/little-doctor/docs/technical-design.md) · [设计风格](apps/little-doctor/docs/design-style.md)。
