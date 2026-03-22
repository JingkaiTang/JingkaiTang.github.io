#!/usr/bin/env bash
# setup.sh - 从 TOOLS.md 读取微信公众号环境变量
# Usage: source ./setup.sh

CRED_FILE="$HOME/.wechat-publisher.env"

# 优先使用已存在的环境变量
if [ -n "$WECHAT_APP_ID" ] && [ -n "$WECHAT_APP_SECRET" ]; then
    export WECHAT_APP_ID
    export WECHAT_APP_SECRET
else
    # 检查凭证文件是否存在
    if [ ! -f "$CRED_FILE" ]; then
        echo "❌ 找不到凭证文件: $CRED_FILE"
        echo ""
        echo "请在该文件中添加微信公众号凭证："
        echo ""
        echo "WECHAT_APP_ID=your_app_id"
        echo "WECHAT_APP_SECRET=your_app_secret"
        exit 1
    fi

    # 从凭证文件提取凭证（支持 export 与非 export 格式）
    WECHAT_APP_ID=$(grep -E "^(export[[:space:]]+)?WECHAT_APP_ID=" "$CRED_FILE" | head -1 | sed -E 's/^(export[[:space:]]+)?WECHAT_APP_ID=//' | tr -d ' ')
    WECHAT_APP_SECRET=$(grep -E "^(export[[:space:]]+)?WECHAT_APP_SECRET=" "$CRED_FILE" | head -1 | sed -E 's/^(export[[:space:]]+)?WECHAT_APP_SECRET=//' | tr -d ' ')
fi

# 检查是否成功提取
if [ -z "$WECHAT_APP_ID" ] || [ -z "$WECHAT_APP_SECRET" ]; then
    echo "❌ 无法从 TOOLS.md 读取凭证！"
    echo ""
    echo "请确保 TOOLS.md 包含以下格式："
    echo ""
    echo "export WECHAT_APP_ID=your_app_id"
    echo "export WECHAT_APP_SECRET=your_app_secret"
    exit 1
fi

# 设置环境变量
export WECHAT_APP_ID
export WECHAT_APP_SECRET

echo "✅ 微信公众号环境变量已从 TOOLS.md 加载！"
echo ""
echo "  WECHAT_APP_ID=${WECHAT_APP_ID:0:10}..."
echo "  WECHAT_APP_SECRET=****** (已隐藏)"
echo ""
echo "💡 提示：这些变量仅在当前 shell 会话有效"
