# TOOLS.md - JingkaiTang.github.io 项目专用

## 项目信息

- **仓库：** https://github.com/JingkaiTang/JingkaiTang.github.io
- **类型：** Hexo 博客
- **部署：** GitHub Pages
- **主题：** 自定义

## 本地路径

- **项目根目录：** `~/workspace/JingkaiTang.github.io/`
- **文章目录：** `source/_posts/`
- **Now 文件：** `source/now.md`
- **配置文件：** `_config.yml`

## 常用命令

```bash
# 本地预览
hexo clean && hexo generate && hexo server

# 部署
hexo clean && hexo generate && hexo deploy

# 新建文章
hexo new post "文章标题"
```

## 工作流程

1. 任何改动先创建分支：`git checkout -b feat/xxx`
2. 本地测试通过后提交
3. 创建 PR
4. 等待 review 后合并到 main
