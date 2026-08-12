#!/bin/bash
# 部署脚本 - 将构建产物上传到 puzzle.wlm.wang 的正确位置
# 用法: bash deploy.sh
# 注意: Nginx 实际服务目录是 /www/wwwroot/puzzle.wlm.wang/
#       NOT /root/portfolio-blog/public/playables/block-puzzle/

set -e

SERVER="root@39.96.58.245"
REMOTE_PATH="/www/wwwroot/puzzle.wlm.wang/"
LOCAL_BUILD="../个人Blog/public/playables/block-puzzle/"

echo "🔨 Building..."
npm run build

echo "🚀 Deploying to $SERVER:$REMOTE_PATH"
scp -o StrictHostKeyChecking=no -r ${LOCAL_BUILD}* ${SERVER}:${REMOTE_PATH}

echo "✅ Deployed successfully to puzzle.wlm.wang"
