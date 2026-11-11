# OnDevice Kit 官网

Android 端侧 AI 工具箱 [OnDevice Kit](https://github.com/Camille-2010/OnDevice-Kit) 的官方单页介绍站。

**纯静态、零构建、零依赖**：原生 HTML + CSS + 一个 vanilla JS，没有框架、没有打包器、没有 npm 依赖。把本仓库根目录直接作为网站根目录即可，改完文件推上来就生效。

## 目录结构

```
index.html          页面入口 + SEO / OG / JSON-LD
styles.css          全部样式（设计系统在 :root）
app.js              全部交互（IIFE，无外部依赖）
assets/
  icons3d/          App 真实 3D 图标（256×256 PNG）
  icons/            线性 SVG 小图标
  shots/            8 张真机截图
  qq-group-qrcode.png   QQ 群二维码
  og-cover.jpg      社交分享封面
favicon.png
robots.txt / sitemap.xml
CONTENT.md          内部文案底稿（不渲染到页面，含历史废弃词，勿据此恢复功能）
scripts/set-domain.mjs   绑定自定义域名的一键替换脚本
.github/workflows/deploy-pages.yml   GitHub Pages 自动部署
```

## 本地预览

直接双击 `index.html` 即可（全部资源相对路径）。或起个本地服务，避免 `file://` 的限制：

```bash
python3 -m http.server 8080
# 打开 http://localhost:8080
```

## 域名与 SEO

站点当前正式域名：**`https://ondevkit-10h3s3oe.maozi.io`**（canonical / hreflang / og:url / og:image / twitter:image、sitemap.xml、robots.txt 已全部写好，没有占位符）。

以后换成自己的域名时，运行：

```bash
node scripts/set-domain.mjs ondevice.example.com
```

脚本会替换上述全部位置并生成 `CNAME`（仅 GitHub Pages 需要），然后提交推送即可。

## 安全说明

- `index.html` 带 **CSP meta**：`default-src 'self'`、`object-src 'none'`、`base-uri 'self'`、`form-action 'none'`；`style-src` 保留 `'unsafe-inline'` 是因为 22 张能力卡用 `style="color:#xxx"` 内联主题色；`connect-src` 显式列出下载探测用的 GitHub 与公共加速域名，删掉会让自动选线失效。
- **`frame-ancestors` / `X-Frame-Options` 无法通过 HTML meta 生效**，必须由托管平台设置响应头：

```
Content-Security-Policy: frame-ancestors 'none'
X-Frame-Options: DENY
```

  在帽子云 / maozi 控制台的「自定义响应头」里加这两条（静态托管侧配置，源码改不了）。
- 已确认无 XSS 面：无 `eval` / `new Function`，`innerHTML` 仅拼接静态数据；仓库不含密钥、`.env`、备份文件。


## 部署方式（任选一种）

### A. GitHub Pages（本仓库已配好）

1. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。
2. 每次 push 到 `main` 会自动跑 `.github/workflows/deploy-pages.yml` 发布。
3. 默认地址：`https://Camille-2010.github.io/ondevice-kit-site/`。
4. 绑自定义域名：在域名 DNS 加一条 `CNAME` 记录指向 `Camille-2010.github.io`，仓库根目录放 `CNAME` 文件（运行上面的脚本会自动生成），再到 Pages 设置里填域名并开启 **Enforce HTTPS**。

### B. Vercel / Netlify / Cloudflare Pages（更省事，推荐）

1. 控制台选 **Import from Git** → 选本仓库。
2. **构建命令留空、输出目录填仓库根目录**（纯静态，无需构建）。
3. 平台自动签 HTTPS 证书，在 **Domains / Custom domains** 里填自己的域名，按提示加 DNS 记录即可。
   - 这几个平台**不需要** `CNAME` 文件，脚本生成的那个可以删掉或忽略。

### C. 自己的 Nginx / 宝塔 / 1Panel 服务器

1. 把本仓库全部文件上传到站点根目录（保证 `index.html` 在根）。
2. 先建站点并绑定域名，域名 A 记录指向服务器 IP。
3. 再申请 Let's Encrypt 证书；验证方式选 **HTTP**（80 端口公网可达时最省事）。
4. 开启 HTTPS / 强制跳转。

## 自定义域名 DNS 速查

| 目标 | 记录类型 | 记录值 |
|---|---|---|
| GitHub Pages 子域（如 `ondevice.example.com`） | CNAME | `Camille-2010.github.io` |
| 自有服务器 | A | 服务器公网 IP |
| Vercel / Netlify / Cloudflare Pages | 按平台控制台提示 | 通常是 CNAME |

- 用国内服务器且域名在国内接入，需要 ICP 备案；用境外静态托管不需要。
- DNS 生效通常几分钟到几小时，HTTPS 证书在解析生效后才会签发成功。

## 日常更新网页

官网有**两份副本**，不要各改各的：

- `site/`（WorkBuddy 工作区）＝ 主开发副本，平时在这里改，里面写的是 WorkBuddy 线上域名
- 本仓库 ＝ 部署副本，域名是占位符或你已绑定的正式域名，额外带 README / LICENSE / workflow 等文件

在工作区根目录用同步脚本，避免域名被改回、附加文件被覆盖：

```bash
python sync-to-github.py --check    # 只看差异，不写文件
python sync-to-github.py            # 同步并列出改动
python sync-to-github.py --commit   # 同步并自动 git commit
git -C github-site push             # 推送（脚本绝不自动推）
```

推送后到托管平台点「重新部署」，或等平台自动拉取更新。

- 脚本会从 `CNAME` 或 `index.html` 的 canonical 读取仓库**当前域名**并沿用它，改域名时不会把 SEO 链接打回旧值。
- 没有 WorkBuddy 工作区时，直接改本仓库的 `index.html` / `styles.css` / `app.js` 再 commit 也一样。
- 改了 `styles.css` 或 `app.js`，记得把 `index.html` 里两个 `?v=17` 一起自增。

## 维护约定

- 改了 `styles.css` 或 `app.js`，要把 `index.html` 里两个 `?v=17` 一起自增，否则浏览器用旧缓存。
- 资源全是相对路径，仓库可放在任何子路径下；换成自定义域名根目录也无需改动。
- 图标与 App 保持一致，不要重新设计造型；`.i3d img { filter: none }` 统一规则别删。
- 能力卡当前 22 张（创作 8 / 智能 4 / 生态 5 / 底座 5），增删卡片要同步改 hero 与标题里的数字。
- QQ 弹窗：短按二维码跳 QQ 群、长按 500ms 复制群号 `1135341430`，逻辑在 `app.js` 末尾。

## 许可

MIT，见 [LICENSE](LICENSE)。基于 [PocketPal AI](https://github.com/a-ghorbani/pocketpal-ai)（MIT）二次开发；如与实际授权情况不符，请以你的项目为准修改 LICENSE。
