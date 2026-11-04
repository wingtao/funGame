# wxt-extension

使用根目录的 `pnpm new wxt-extension my-project` 创建作品，然后运行 `pnpm install`。

开发：`pnpm --filter my-project dev`；构建：`pnpm --filter my-project build`。

构建输出在 `.output/chrome-mv3/`；在 Chrome 扩展管理页启用开发者模式并加载此目录。Firefox 使用 `build:firefox`。默认不申请额外权限，按实际功能添加。
