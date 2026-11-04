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

- `apps/`：独立作品，初始为空。
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

- 默认 TypeScript、纯前端与本地存储。需要账号、云同步时再加入 Supabase；付费 API 密钥放服务端。
- 默认网站组件方案为 shadcn/ui + Radix。可在具体作品目录执行 `pnpm dlx shadcn@latest add dialog` 等命令。Mantine、Ant Design、React Aria、DaisyUI 由各作品按需选用。
- 动画按需选 Motion；图表选 Recharts / ECharts；拖拽选 dnd-kit；音效选 Howler.js；自定义 2D 渲染选 PixiJS，3D 选 Three.js + React Three Fiber。
- 简单游戏直接用 React / Canvas，复杂 2D 游戏使用 Phaser。
- 状态先用 React，复杂后再考虑 Zustand。公共 UI 和工具在出现实际复用需求后提取。
- Vitest 用于关键逻辑，Playwright 用于核心操作流程，有需要时安装到对应作品。
- 子项目使用小写短横线名称。新项目完成后维护自己的 README 和 `.env.example`，不提交密钥。

## TypeScript 与 Lint 规范

业务代码默认使用 TypeScript。规则和示例见 [代码质量规范](docs/code-quality.md)。使用 `pnpm lint:fix` 自动修复，`pnpm check` 执行与 CI 相同的检查。
