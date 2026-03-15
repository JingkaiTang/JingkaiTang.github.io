# GitHub Pins 定时更新任务

## 功能
每天凌晨 2:00 (Asia/Shanghai) 自动更新 `src/data/github-pins.json`

## 部署方式

### 1. 编辑 crontab
```bash
crontab -e
```

### 2. 添加任务
```bash
# GitHub Pins 每日更新 (02:00 Asia/Shanghai)
0 2 * * * cd /home/t7kai/workspace/JingkaiTang.github.io && /usr/bin/node scripts/cron-update-pins.mjs >> /home/t7kai/workspace/JingkaiTang.github.io/logs/cron-pins.log 2>&1
```

### 3. 创建日志目录
```bash
mkdir -p /home/t7kai/workspace/JingkaiTang.github.io/logs
```

### 4. 验证 crontab
```bash
crontab -l
```

## 手动测试
```bash
cd /home/t7kai/workspace/JingkaiTang.github.io
node scripts/cron-update-pins.mjs
```

## 查看日志
```bash
tail -f logs/cron-pins.log
```

## 注意事项
- 确保 cron 服务已启动：`systemctl status cron`
- 确保 node 路径正确：`which node`
- 确保 SSH key 已配置（用于 git push）
