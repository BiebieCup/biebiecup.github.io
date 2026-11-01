# 第六届憋憋杯 · 赛事站

基于《第六届憋憋杯参赛指南》整理的静态站点，纯 HTML / CSS / JavaScript，无框架、无构建步骤，可直接部署到 GitHub Pages。

- **`index.html`** — 整体主页：赛事总览、入口、进程、动态、直播、FAQ 精选
- **`guide.html`** — 完整参赛指南：赛道、规则、投稿、评分、奖品、违规处理与全部 FAQ

![站点预览](./preview.png)

## 页面结构

| 文件 | 内容 |
| --- | --- |
| `index.html` | 首屏与倒计时、赛事速览、四个入口（指南 / 赛道 / 奖品 / 直播）、赛事进程、最新动态、直播与观赛、FAQ 精选、加群与邮件 |
| `guide.html` | 01 速览、02 赛道、03 时间、04 规则、05 投稿（模板 / 生成器 / 自查清单）、06 评分、07 奖品、08 直播、09 违规、10 FAQ |

主页与指南之间用相对链接互通：主页的“参赛指南”指向 `guide.html`，指南的“首页”与 Logo 指回 `index.html`；跨页锚点（如 `guide.html#tracks`）可直接跳到对应板块。

## 目录结构

```
.
├── index.html              # 主页
├── guide.html              # 完整参赛指南
├── preview.png             # 站点预览图（README 用）
├── assets/
│   ├── css/style.css       # 设计系统与全部样式（含主页组件）
│   ├── js/main.js          # 倒计时、时间线、复制、生成器、清单、背景动画
│   └── favicon.svg
├── .nojekyll               # 让 GitHub Pages 跳过 Jekyll 处理
└── README.md
```

## 本地预览

直接双击 `index.html` 即可（`file://` 下除剪贴板 API 会走降级方案外，其余功能均可用）。

若想更接近线上环境：

```bash
# 任选其一
python -m http.server 8080
npx serve .
```

然后访问 `http://localhost:8080`。

## 部署到 GitHub Pages

1. 新建一个仓库（例如 `biebiecup-6th`），把本目录全部文件推上去：

   ```bash
   git init
   git add .
   git commit -m "feat: 第六届憋憋杯赛事站"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```

2. 打开仓库 **Settings → Pages**。
3. **Source** 选择 `Deploy from a branch`，**Branch** 选 `main`、目录选 `/ (root)`，保存。
4. 等待 1–2 分钟，访问 `https://<你的用户名>.github.io/<仓库名>/`。

> 所有资源都使用相对路径（`./assets/...`），因此部署在仓库子路径下也能正常加载。
> 如果绑定自定义域名，在 Pages 设置里填好域名即可，无需改代码。

## 日常维护

- **改主页文案 / 动态**：编辑 `index.html` 中的 `#news`、`#start` 等板块；新增动态照抄一条 `<li class="news-item">` 即可。
- **改指南内容**：编辑 `guide.html` 对应板块。
- **改时间**：`assets/js/main.js` 顶部的三个常量：

  ```js
  var T_OPEN     = new Date('2026-08-24T00:00:00+08:00');
  var T_DEADLINE = new Date('2027-01-27T00:00:00+08:00');
  var T_LIVE     = new Date('2027-02-08T19:00:00+08:00');
  ```

  两页的倒计时、首屏状态文案、时间线高亮都由这三个时间驱动，改完即同步。
- **改主题色**：`assets/css/style.css` 顶部 `:root` 中的 `--mint` / `--violet` / `--gold`。
- **改生成器默认值**：`guide.html` 中 `#generator` 里各 `input` 的 `placeholder`。
- **改导航**：两页的导航各自独立；新增跨页入口时记得同时补 `guide.html` 的“首页”链接。

## 说明

- 本站为赛事信息整理页，非官方唯一渠道；规则、时间、奖品等以主办方最新通知为准，最终解释权归主办方所有。
- 页面无任何第三方请求（无 CDN、无统计、无字体外链），可离线打开；邮件生成器与自查清单均在本地浏览器运行，不会上传数据。
