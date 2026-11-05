# 三个静态作品的 Vercel 部署

三个作品各自部署为独立站点，不需要后端、环境变量或数据库。团队为 `ttt-projects`。每次发布前运行 `pnpm check`、`pnpm test`、`pnpm build` 与 `pnpm test:e2e`。

| 应用       | 计划项目名             | Git 导入时的 Root Directory | 产物                     |
| ---------- | ---------------------- | --------------------------- | ------------------------ |
| 买车测评   | fungame-car-fit        | apps/car-fit                | apps/car-fit/dist        |
| 今日已赚   | fungame-daily-earnings | apps/daily-earnings         | apps/daily-earnings/dist |
| 身体探险队 | fungame-little-doctor  | apps/little-doctor          | apps/little-doctor/dist  |

## 本次发布方式

Vercel 团队权限由用户授权。其 Git 集成目前返回 `github_response_error`，因此代码独立提交到 GitHub；发布使用同一工作区构建并经过测试的静态文件，由 Vercel API 创建生产部署，并记录 Git 提交号。不依赖该 Git 集成，不代表已经建立 push 自动部署。

静态产物部署上传 dist 中的文件，保持 index.html 与 assets 的相对路径；Vercel 项目使用静态设置，不执行第二次远程构建。线上验证检查 HTML、资源与 PC / 手机交互，不通过关闭部署保护来绕过访问限制。

## 后续使用 Git 自动部署

恢复 Vercel 的 GitHub 连接后，把对应项目连接到 `wingtao/funGame`，选择上表 Root Directory，并允许使用根目录之外的工作区文件。使用 Node.js 24，各应用 vercel.json 已提供 Vite、固定 pnpm 11.25.0 的安装命令、构建命令和 dist 输出目录。Root Directory 是项目设置，不写进 vercel.json。

浏览器本地数据按站点 origin 隔离；本地开发、预览 URL 和正式域名之间不会自动同步设置或贴纸。

语音使用设备本地中文音色。部署成功与 Web Speech 调用测试通过不代表所有终端都安装了中文语音；真机需检查音量、浏览器兼容性及系统音色。

## 已发布站点

发布代码：`c121eb97a9aa8c5bb4b57c722577c1db5c2fe80d`；目标：production；状态：三个项目均 READY；框架：Vite 静态产物。

| 作品       | 正式地址                                  | Vercel 项目 ID                   | 部署 ID                          |
| ---------- | ----------------------------------------- | -------------------------------- | -------------------------------- |
| 买车测评   | https://fungame-car-fit.vercel.app        | prj_yPkscQahaRhqSBeRr6M108UY1QyH | dpl_5s5pVdpRTy3tMua4ujosvn14RKbB |
| 今日已赚   | https://fungame-daily-earnings.vercel.app | prj_sQAA1LXQI05YDt5pvD1553ccFWgJ | dpl_EN98gcdG2cp5UTVLWyKnEGN7tggq |
| 身体探险队 | https://fungame-little-doctor.vercel.app  | prj_BXz6BHCVSn4QwdNQmziwY8PGLzgW | dpl_Fpv582k3EnRZAcT8hNNDQEo1kuwT |

验证：本地生产构建通过 26 项单元测试和 13 条端到端流程测试，包含 PC / H5、隐私、配置、断网及语音调用 / 重播 / 关闭。使用 Vercel 授权访问工具检查了三个正式地址的 HTML 和全部 JS / CSS 文件，全部 HTTP 200；本记录不把授权访问等同于匿名可访问，也不把模拟语音测试等同于真机听感验证。

团队默认部署保护保持不变，未放宽权限、未配置远程行为采集。站点是纯静态应用，未添加函数运行时或日志采集服务。
