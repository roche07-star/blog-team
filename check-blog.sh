#!/bin/bash
# 블로팀 - 오늘 블로그 발행 여부 자동 확인 및 동기화

cd "$(dirname "$0")"

TODAY=$(date +'%Y-%m-%d')
echo "📅 오늘 날짜: $TODAY"
echo ""

# 오늘 블로그 발행 확인
if git log --oneline --all | grep -q "일일 블로그.*$TODAY"; then
  echo "✅ 오늘 블로그 이미 발행됨:"
  git log --oneline --all | grep "일일 블로그.*$TODAY" | head -1

  # 발행된 파일 목록 표시
  echo ""
  echo "📝 발행된 콘텐츠:"
  find 발행 -type f -name "*$TODAY*" 2>/dev/null | while read file; do
    echo "  - $(basename "$file")"
  done

  exit 0
fi

echo "❌ 오늘 블로그 아직 발행 안됨"
echo "📥 git pull 실행 중..."
echo ""

BEFORE=$(git rev-parse HEAD)
git pull --quiet

AFTER=$(git rev-parse HEAD)

if [ "$BEFORE" != "$AFTER" ]; then
  echo "✅ 새로운 커밋 받음:"
  git log --oneline $BEFORE..$AFTER
  echo ""

  # 다시 확인
  if git log --oneline --all | grep -q "일일 블로그.*$TODAY"; then
    echo "🎉 오늘 블로그 발행 확인!"
    git log --oneline --all | grep "일일 블로그.*$TODAY" | head -1

    # 발행된 파일 목록 표시
    echo ""
    echo "📝 발행된 콘텐츠:"
    find 발행 -type f -name "*$TODAY*" 2>/dev/null | while read file; do
      echo "  - $(basename "$file")"
    done
  else
    echo "⏰ 아직 발행 전 (오늘 아침 09:00 예정)"
  fi
else
  echo "ℹ️  이미 최신 상태"
  echo "⏰ 오늘 블로그는 오늘 아침 09:00에 발행됩니다"
fi

echo ""
echo "📊 최근 5일 발행 기록:"
git log --oneline --grep="일일 블로그" -5
