#!/usr/bin/env sh
set -eu

grep -RIn --exclude-dir=node_modules --exclude-dir=.next --exclude='*.json' --exclude='*.lock' \
  -e "暂无" \
  -e "还没有" \
  -e "失败" \
  -e "加载" \
  -e "返回首页" \
  -e "请先登录" \
  -e "Permission" \
  -e "Failed to" \
  -e "Error" \
  src
