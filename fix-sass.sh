#!/bin/bash
# 修复 Sass @import 警告 - 将 SCSS 变量替换为 CSS 变量

cd src/pages

for file in */*.vue; do
  echo "处理: $file"
  # 移除 @import 行
  sed -i '' '/@import.*styles/d' "$file"
  # 替换 SCSS 变量为 CSS 变量
  sed -i '' 's/\$primary-/var(--primary-/g' "$file"
  sed -i '' 's/\$accent-/var(--accent-/g' "$file"
  sed -i '' 's/\$neutral-/var(--neutral-/g' "$file"
  sed -i '' 's/\$bg-/var(--bg-/g' "$file"
  sed -i '' 's/\$text-/var(--text-/g' "$file"
  sed -i '' 's/\$border-/var(--border-/g' "$file"
  sed -i '' 's/\$space-/var(--space-/g' "$file"
  sed -i '' 's/\$radius-/var(--radius-/g' "$file"
  sed -i '' 's/\$shadow-/var(--shadow-/g' "$file"
  sed -i '' 's/\$success/var(--success/g' "$file"
  sed -i '' 's/\$warning/var(--warning/g' "$file"
  sed -i '' 's/\$error/var(--error/g' "$file"
  sed -i '' 's/\$info/var(--info/g' "$file"
  # 将 lang="scss" 改为 scoped
  sed -i '' 's/lang="scss" //g' "$file"
done

echo "完成！"
