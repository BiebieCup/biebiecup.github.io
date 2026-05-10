# 憋憋杯 (BBC) — Phigros 自制谱赛事官方网站

**网址：** [fzso5071.github.io/bbc](https://fzso5071.github.io/bbc)

---

## 📋 项目简介

憋憋杯（BBC）是一个基于 **GitHub Pages + Supabase** 搭建的 Phigros 自制谱赛事官方网站。
前端使用 **React + Vite + Tailwind CSS**，后端数据与认证全部依托 **Supabase**（PostgreSQL + Auth + Storage）。

---

## 🗂️ 功能一览

| 功能模块 | 说明 |
|---|---|
| 首页 | 查看当前赛事状态、最新公告摘要、快捷入口 |
| 公告栏 | 查看管理员发布的赛事公告，支持置顶 |
| 谱面下载 | 直播后由管理员发布，提供谱面合集下载链接 |
| 注册 / 登录 | 使用邮箱 + 密码注册，登录后才能投稿 |
| 我的投稿 | 查看本人所有投稿及审核状态（待审/已通过/已打回） |
| 谱面投稿 | 上传 `.zip` / `.pez` 谱面文件，选择赛道与模式 |
| 管理员后台 | 仅限指定邮箱账号访问，管理投稿/公告/赛事/下载 |

---

## 🎮 投稿规则

### 赛道

- **常规赛道**：使用 EZ / HD / IN / AT 预设标级，也可自定义标级
- **娱乐赛道**：不限标级，自由创作

### 投稿模式

- **单人模式**：独立完成谱面
- **多人协作**：可在投稿时搜索并添加其他已注册用户为联合投稿者，联合投稿同样计入每人的投稿次数

### 投稿限制

- 每人最多投稿 **5 张**（包含作为协作者参与的谱面）
- 上传文件格式：`.zip` 或 `.pez`，单文件最大 **50MB**

### 实名 / 匿名

由管理员在开启赛事时选择本届为 **实名** 或 **匿名** 模式：
- 实名：谱师信息对外公开显示
- 匿名：观众不可见投稿者信息（管理员后台仍可查看）

---

## 🔐 账号说明

### 普通用户

任何人均可通过注册页面创建账号（邮箱 + 密码），注册后需通过 Supabase 邮件验证激活账号。

### 管理员账号

以下两个邮箱固定为管理员身份，注册时使用这些邮箱即可获得管理权限：

| 邮箱 | 初始密码 |
|---|---|
| `1412422438@qq.com` | `$5071fzso!` |
| `fzso5071@qq.com` | `$5071fzso!` |

> ⚠️ **首次使用前请前往 Supabase 手动注册以上两个账号**（见下方部署步骤），注册完成后即可使用管理员后台功能。

---

## 🖥️ 管理员后台功能

访问路径：登录管理员账号后，导航栏会出现「管理后台」入口（路径 `/admin`）。

### 1. 投稿审核（Submissions）

- 查看所有投稿（包含投稿者用户名与邮箱）
- 可按「待审核 / 已通过 / 已打回」过滤
- 点击展开投稿详情，填写审核备注后选择「通过」或「打回」
- 审核结果会实时反映在投稿者的「我的投稿」页面

### 2. 发布公告（Announcements）

- 填写标题与正文发布公告，支持设置「置顶」
- 可删除已有公告

### 3. 谱面下载发布（Downloads）

- 填写标题、描述、外链（如网盘/OneDrive 链接）和文件名
- 发布后在「谱面下载」页面对所有用户可见

### 4. 赛事管理（Events）

- 开启新一届赛事，需设置：
  - 赛事名称 & 简介
  - 投稿开始时间 / 截止时间
  - 直播时间
  - 投票开始时间 / 投票截止时间
  - 匿名 / 实名模式
- 同一时间只有一届赛事处于「激活」状态
- 可随时激活/停用某届赛事

---

## 🚀 部署步骤

### 第一步：创建 Supabase 项目

1. 前往 [supabase.com](https://supabase.com) 注册并创建一个新项目
2. 记录项目的 **Project URL** 和 **Anon Key**（在 Project Settings → API 中）

### 第二步：初始化数据库（SQL Editor）

在 Supabase 控制台的 **SQL Editor** 中执行以下 SQL：

```sql
-- 用户资料表
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 赛事表
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  live_time TIMESTAMPTZ NOT NULL,
  vote_start TIMESTAMPTZ NOT NULL,
  vote_end TIMESTAMPTZ NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by all" ON public.events FOR SELECT USING (true);
CREATE POLICY "Events manageable by admins" ON public.events FOR ALL USING (
  auth.jwt() ->> 'email' IN ('1412422438@qq.com', 'fzso5071@qq.com')
);

-- 公告表
CREATE TABLE public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  event_id UUID REFERENCES public.events(id),
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Announcements viewable by all" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Announcements manageable by admins" ON public.announcements FOR ALL USING (
  auth.jwt() ->> 'email' IN ('1412422438@qq.com', 'fzso5071@qq.com')
);

-- 投稿表
CREATE TABLE public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) NOT NULL,
  submitter_id UUID REFERENCES auth.users(id) NOT NULL,
  track_type TEXT NOT NULL CHECK (track_type IN ('regular', 'entertainment')),
  level_label TEXT DEFAULT '',
  song_name TEXT NOT NULL,
  composer TEXT NOT NULL,
  charter TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('solo', 'collab')),
  collaborators UUID[] DEFAULT '{}',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own submissions" ON public.submissions FOR SELECT USING (
  auth.uid() = submitter_id OR
  auth.jwt() ->> 'email' IN ('1412422438@qq.com', 'fzso5071@qq.com')
);
CREATE POLICY "Logged in users can insert submissions" ON public.submissions FOR INSERT WITH CHECK (
  auth.uid() = submitter_id
);
CREATE POLICY "Admins can update submissions" ON public.submissions FOR UPDATE USING (
  auth.jwt() ->> 'email' IN ('1412422438@qq.com', 'fzso5071@qq.com')
);

-- 下载表
CREATE TABLE public.downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  released_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Downloads viewable by all" ON public.downloads FOR SELECT USING (true);
CREATE POLICY "Downloads manageable by admins" ON public.downloads FOR ALL USING (
  auth.jwt() ->> 'email' IN ('1412422438@qq.com', 'fzso5071@qq.com')
);
```

### 第三步：创建 Storage Bucket

在 Supabase 控制台 → **Storage** → 新建 Bucket：
- Bucket 名称：`submissions`
- 选择 **Public**（以便生成公开访问链接）

设置 Storage 策略（SQL Editor）：
```sql
-- 允许已登录用户上传谱面
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'submissions' AND auth.role() = 'authenticated');

-- 允许所有人读取
CREATE POLICY "Public read submissions" ON storage.objects
  FOR SELECT USING (bucket_id = 'submissions');
```

### 第四步：注册管理员账号

在 Supabase 控制台 → **Authentication** → **Users** → **Invite user**，或直接在网站注册页面使用以下邮箱注册：
- `1412422438@qq.com`（密码：`$5071fzso!`）
- `fzso5071@qq.com`（密码：`$5071fzso!`）

### 第五步：配置环境变量

在项目根目录创建 `.env` 文件（**不要提交到 Git**）：

```env
VITE_SUPABASE_URL=https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon公钥
```

或直接修改 `src/lib/supabase.ts` 中的默认值（仅用于快速测试）。

### 第六步：部署到 GitHub Pages

1. 推送代码到 GitHub 仓库 `fzso5071/bbc`

2. 在仓库 Settings → Secrets → Actions 中添加：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. 创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

4. 在 GitHub 仓库 Settings → Pages → Source 中选择 `gh-pages` 分支

---

## 🛠️ 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（需配置 .env）
npm run dev

# 构建生产版本
npm run build
```

---

## 📁 项目结构

```
src/
├── App.tsx                    # 路由入口
├── main.tsx                   # React 根渲染
├── vite-env.d.ts              # 环境变量类型声明
├── contexts/
│   └── AuthContext.tsx        # 全局认证上下文
├── lib/
│   └── supabase.ts            # Supabase 客户端 & 常量
├── components/
│   └── Layout.tsx             # 页面布局 & 导航栏
└── pages/
    ├── HomePage.tsx           # 主页
    ├── AnnouncementsPage.tsx  # 公告列表 & 详情
    ├── DownloadsPage.tsx      # 谱面下载
    ├── AuthPages.tsx          # 登录 & 注册
    ├── SubmitPage.tsx         # 谱面投稿
    ├── MySubmissionsPage.tsx  # 我的投稿
    └── AdminPage.tsx          # 管理员后台
```

---

## 📦 技术栈

| 技术 | 用途 |
|---|---|
| React 19 + TypeScript | 前端框架 |
| Vite | 构建工具 |
| Tailwind CSS v4 | 样式系统 |
| React Router v6 | 前端路由 |
| Supabase | 数据库 + 认证 + 文件存储 |
| react-hot-toast | 消息提示 |
| lucide-react | 图标库 |
| date-fns | 日期格式化 |

---

## ⚠️ 注意事项

1. **Supabase 免费版限制**：免费计划每月有一定的存储和流量限制，大量谱面文件建议使用外部网盘（管理员在「谱面下载」中填写外链即可）
2. **RLS 策略**：所有数据表已启用行级安全策略，管理员通过 JWT 邮箱字段鉴权
3. **匿名模式**：匿名投稿仅影响前端展示，管理员后台始终可见投稿者信息
4. **环境变量**：不要将 `.env` 文件提交至 Git，`anon key` 属于公开密钥但也不建议明文写入代码

---

## 📬 联系方式

- 主办邮箱：fzso5071@qq.com
- 网站：[fzso5071.github.io/bbc](https://fzso5071.github.io/bbc)
