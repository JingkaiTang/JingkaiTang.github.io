# GitHub Pins 定时更新任务

## 功能
每天凌晨 2:00 (Asia/Shanghai) 自动更新 `src/data/github-pins.json`

## 部署方式

### 1. 设置仓库路径
```bash
# 替换为你的仓库路径
REPO_PATH="/home/t7kai/workspace/JingkaiTang.github.io"
```

### 2. 创建日志目录
```bash
mkdir -p $REPO_PATH/logs
```

### 3. 编辑 crontab
```bash
crontab -e
```

### 4. 添加任务
```bash
# GitHub Pins 每日更新 (02:00 Asia/Shanghai)
0 2 * * * cd $REPO_PATH && /usr/bin/node scripts/cron-update-pins.mjs >> $REPO_PATH/logs/cron-pins.log 2>&1
```

### 5. 验证 crontab
```bash
crontab -l
```

## 手动测试
```bash
cd $REPO_PATH
node scripts/cron-update-pins.mjs
```

## 查看日志
```bash
tail -f $REPO_PATH/logs/cron-pins.log
```

## 注意事项
- 确保 cron 服务已启动：`systemctl status cron`
- 确保 node 路径正确：`which node`（如果不是 `/usr/bin/node`，请修改 crontab）
- 确保 SSH key 已配置（用于 git push）
- 确保 git 全局配置已设置（user.name, user.email）
