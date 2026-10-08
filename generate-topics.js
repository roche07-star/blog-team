import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config();

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

async function generateWeeklyTopics(startDate) {
  console.log('🔄 일주일 주제 생성 시작...\n');
  console.log(`📅 시작일: ${startDate}\n`);

  // 이전 주제 목록 가져오기 (중복 방지)
  const prevTopics = [];
  try {
    const topicsDir = path.join('주제목록', 'blogspot');
    const files = fs.readdirSync(topicsDir).filter(f => f.endsWith('.json'));
    files.forEach(file => {
      const data = JSON.parse(fs.readFileSync(path.join(topicsDir, file), 'utf8'));
      if (data.topics) {
        data.topics.forEach(t => {
          if (t.name && t.name !== 'NEW_TOPIC_PLACEHOLDER') {
            prevTopics.push(t.name);
          }
        });
      }
    });
    console.log(`  📋 이전 주제 ${prevTopics.length}개 확인\n`);
  } catch (err) {
    console.log('  (이전 주제 없음)\n');
  }

  const prevTopicsStr = prevTopics.length > 0
    ? `\n\n⚠️ AVOID these previously used topics:\n${prevTopics.map(t => `- ${t}`).join('\n')}`
    : '';

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are an AI industry analyst. Suggest trending AI-related issues and topics for in-depth blog posts.'
          },
          {
            role: 'user',
            content: `Suggest 7 UNIQUE trending AI-related ISSUES or TOPICS for the next 7 days starting from ${startDate}.

Each topic should focus on:
- Current trends, challenges, or debates in AI
- Technical issues, ethical concerns, or industry shifts
- Practical analysis, case studies, or insights

Categories to cover: AI Ethics, AI Regulation, AI in Business, AI Security, AI Innovation, AI Impact, AI Trends, AI Challenges${prevTopicsStr}

IMPORTANT:
- Each topic must be COMPLETELY DIFFERENT from previous topics
- Focus on 2026 current issues and trends
- NOT "Tool A vs Tool B" format - instead focus on issues, trends, analysis
- Use specific, timely topics

Examples:
- "AI 모델 편향성 문제: 현황과 해결 방안"
- "오픈소스 AI의 미래: 기회와 도전"
- "AI 저작권 분쟁: 법적 쟁점과 산업 영향"

Return ONLY a JSON array with 7 topics:
[
  {"category": "AI Ethics", "name": "Issue or Topic Title", "keywords": "keyword1, keyword2, keyword3", "focusPoint": "What to analyze"},
  ...
]`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // JSON 추출
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const rawTopics = JSON.parse(jsonMatch[0]);

    // 날짜 추가
    const topics = rawTopics.map((topic, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().slice(0, 10);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[date.getDay()];

      return {
        day: dayName,
        date: dateStr,
        ...topic
      };
    });
    console.log('✅ 주제 생성 완료!\n');

    topics.forEach((topic, i) => {
      console.log(`${i + 1}. ${topic.date} (${topic.day})`);
      console.log(`   ${topic.category}: ${topic.name}`);
      console.log(`   Focus: ${topic.focusPoint}\n`);
    });

    return topics;

  } catch (error) {
    console.error('❌ 주제 생성 실패:', error.message);
    throw error;
  }
}

async function saveTopics(topics, startDate) {
  const weekNumber = getWeekNumber(new Date(startDate));
  const year = new Date(startDate).getFullYear();
  const weekId = `${year}-W${weekNumber}`;

  const weekFile = path.join('주제목록', 'blogspot', `${weekId}.json`);

  const weekData = {
    week: weekId,
    generated: new Date().toISOString(),
    topics: topics
  };

  fs.writeFileSync(weekFile, JSON.stringify(weekData, null, 2), 'utf8');
  console.log(`✅ 저장 완료: ${weekFile}\n`);
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}

// 실행
const today = new Date();
const todayStr = today.toISOString().slice(0, 10);

console.log('🚀 Blogspot 주제 생성기\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

generateWeeklyTopics(todayStr)
  .then(topics => saveTopics(topics, todayStr))
  .then(() => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 완료!');
  })
  .catch(err => {
    console.error('❌ 오류:', err);
    process.exit(1);
  });
