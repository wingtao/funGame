# TypeScript 与代码检查规范

业务代码、组件、游戏逻辑与插件入口默认使用 TypeScript（`.ts` / `.tsx`）。构建配置尽量使用 `.ts`；仓库级 Node 工具允许使用 `.mjs`。共享规则在 `packages/config-eslint/index.mjs`，自动应用到 `apps/`、`templates/` 和 `packages/`。

## 执行命令

```sh
pnpm lint          # 准备插件生成类型，检查代码；任何 warning 都会导致失败
pnpm lint:fix      # 自动修复可安全修复的问题，其他问题仍需手动处理
pnpm typecheck     # TypeScript 编译检查
pnpm format        # Prettier 格式化
pnpm check         # 运行 lint、typecheck、格式检查，与 CI 一致
```

## 规则约定

| 范围       | 约定                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 类型安全   | 开启 TypeScript strict；禁止显式 any 和 any 带来的不安全赋值、调用、返回与成员访问。外部未知数据先用 unknown，再验证或缩小类型。             |
| 空值处理   | 禁止非空断言 `value!`，先检查空值。开启 noUncheckedIndexedAccess，数组和索引访问需要考虑 undefined。                                         |
| 异步处理   | Promise 必须 await、return 或 catch；不能通过 void 绕过检查。回调不能误传异步函数，禁止 await 非 Promise。catch 回调必须真正处理或记录失败。 |
| 导入导出   | 纯类型使用 import type / export type，禁止重复导入；启用 verbatimModuleSyntax。相对路径与项目已有别名均可使用。                              |
| 未使用内容 | 禁止未使用的变量、参数与捕获错误。确实必须保留的内容以 `_` 开头；解构剔除属性后保留 rest 的模式允许使用。                                    |
| 分支与返回 | 使用严格相等；所有控制语句都加大括号；检查联合类型 switch 穷尽性，禁止 switch 意外贯穿及不完整返回。                                         |
| React      | 检查 Hooks 调用顺序、依赖数组及 React Hooks 官方推荐规则。不要为消除依赖告警随意禁用规则。                                                   |
| 调试与日志 | 业务代码禁止 debugger、alert 和 console.log；允许 console.warn / console.error。scripts 下命令行工具允许正常输出。                           |
| 运行环境   | src 与 entrypoints 提供浏览器全局变量；Node 脚本和构建配置提供 Node 全局变量，避免业务代码误用 process 等运行环境对象。                      |
| 格式       | 由 Prettier 统一为单引号、尾逗号等规则，ESLint 关闭与格式工具冲突的检查。                                                                    |
| 检查豁免   | 无效的 eslint-disable 会报错。@ts-ignore / @ts-nocheck 禁止；@ts-expect-error 必须说明原因，至少 10 个字符。                                 |

不强制添加可推导的类型注解，不强制接口与 type 二选一，不强制为了文件命名或排序改动业务代码。

## 示例

```ts
import type { User } from './types';

function getFirstUser(users: User[]): User | undefined {
  return users[0];
}

async function loadData() {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`);
  }
  const data: unknown = await response.json();
  return data;
}

// React 等要求同步回调的地方，显式捕获异步失败。
function handleClick() {
  loadData().catch((error: unknown) => {
    console.error('加载失败', error);
  });
}
```

生成目录、构建产物、依赖和覆盖率报告不参与检查。WXT 的生成类型由 lint 自动准备，无需提交 `.wxt/`。

新增 TypeScript 项目必须提供包含源文件的 tsconfig.json，以便 ESLint 的 Project Service 执行类型感知检查。新增测试框架或特殊运行环境时，在对应项目配置中精确补充 globals，避免全仓库放宽规则。

确需局部豁免时，使用单行 `eslint-disable-next-line 具体规则 -- 原因`，写明限制；不要整文件关闭类型安全检查。
