import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// .env 파일이 있을 때만 로드
try {
  if (fs.existsSync('.env')) {
    dotenv.config();
  }
} catch (error) {
  console.log('Using environment variables (GitHub Actions mode)');
}

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// AI 도구 카테고리
const AI_CATEGORIES = [
  'AI Productivity',
  'AI Writing',
  'AI Research',
  'AI Meeting Tools',
  'AI Coding',
  'AI Design',
  'AI Email Management'
];

// 이번 주 번호 가져오기 (ISO 8601 week)
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

// 날짜를 요일 이름으로 변환
function getDayName(dayIndex) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayIndex];
}

// HTML 생성
function generateHtml(weekData) {
  const topicsHtml = weekData.topics.map((topic, index) => `
    <div class="topic-card">
      <div class="day-badge">${topic.day}</div>
      <div class="date">${topic.date}</div>
      <div class="category">${topic.category}</div>
      <h3>${topic.name}</h3>
      <p class="keywords"><strong>Keywords:</strong> ${topic.keywords}</p>
      <p class="focus"><strong>Focus:</strong> ${topic.focusPoint}</p>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Topics - ${weekData.week}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      color: white;
      margin-bottom: 40px;
    }

    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      font-weight: 700;
    }

    .header .week {
      font-size: 1.2em;
      opacity: 0.9;
    }

    .header .generated {
      font-size: 0.9em;
      opacity: 0.7;
      margin-top: 5px;
    }

    .topics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .topic-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .topic-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
    }

    .day-badge {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.85em;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .date {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 12px;
    }

    .category {
      font-size: 0.85em;
      color: #667eea;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .topic-card h3 {
      font-size: 1.3em;
      color: #1a1a2e;
      margin-bottom: 16px;
      line-height: 1.4;
    }

    .keywords, .focus {
      font-size: 0.95em;
      line-height: 1.6;
      color: #444;
      margin-bottom: 8px;
    }

    .keywords strong, .focus strong {
      color: #667eea;
    }

    @media (max-width: 768px) {
      body {
        padding: 20px 15px;
      }

      .header h1 {
        font-size: 1.8em;
      }

      .topics-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 Weekly Topics</h1>
      <div class="week">${weekData.week}</div>
      <div class="generated">Generated: ${new Date(weekData.generated).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</div>
    </div>

    <div class="topics-grid">
      ${topicsHtml}
    </div>
  </div>
</body>
</html>`;
}

// Perplexity API로 최신 AI 도구 트렌드 검색
async function searchLatestTrends() {
  console.log('🔍 Searching latest AI productivity tool trends...');

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{
        role: 'user',
        content: `Find the top 7 trending AI productivity tool comparisons for September 2026.

Categories to cover (pick 7 different ones):
- AI Productivity (task management, scheduling, time blocking)
- AI Writing (content creation, copywriting, blogging)
- AI Research (information gathering, fact-checking, citations)
- AI Meeting Tools (transcription, note-taking, summaries)
- AI Coding (code completion, debugging, documentation)
- AI Design (image generation, design tools, creative AI)
- AI Email Management (inbox management, email writing, scheduling)

For each comparison, provide:
1. Category
2. Tool comparison name (e.g., "Tool A vs Tool B vs Tool C")
3. Keywords (3-5 relevant keywords)
4. Focus point (what aspect to emphasize)

Format as JSON array:
[
  {
    "category": "AI Productivity",
    "name": "Notion AI vs Motion vs Reclaim AI",
    "keywords": "AI productivity, task management, time blocking",
    "focusPoint": "Workflow optimization and time savings"
  },
  ...
]

IMPORTANT: Return ONLY valid JSON array, no markdown or explanation.`
      }]
    })
  });

  const data = await response.json();

  // 에러 체크
  if (!response.ok || !data.choices || data.choices.length === 0) {
    console.error('Perplexity API Error:', data);
    throw new Error(`Perplexity API failed: ${data.error?.message || 'Unknown error'}`);
  }

  const content = data.choices[0].message.content;

  // JSON 추출 (마크다운 제거)
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON from Perplexity response');
  }

  return JSON.parse(jsonMatch[0]);
}

// 주간 주제 생성
async function generateWeeklyTopics() {
  try {
    const today = new Date();
    const weekNumber = getWeekNumber(today);
    const outputDir = './주제목록';
    const outputPath = path.join(outputDir, `${weekNumber}.json`);

    // 이미 이번 주 주제가 있으면 건너뛰기
    if (fs.existsSync(outputPath)) {
      console.log(`✅ Topics for ${weekNumber} already exist. Skipping...`);
      return;
    }

    console.log(`\n📅 Generating topics for week: ${weekNumber}\n`);

    // Perplexity에서 최신 트렌드 검색
    const trends = await searchLatestTrends();

    if (trends.length !== 7) {
      console.warn(`⚠️ Expected 7 topics, got ${trends.length}. Adjusting...`);
      // 7개가 안 되면 기본 카테고리로 채우기
      while (trends.length < 7) {
        const category = AI_CATEGORIES[trends.length % AI_CATEGORIES.length];
        trends.push({
          category: category,
          name: `${category} Tools Comparison`,
          keywords: `${category}, productivity, comparison`,
          focusPoint: 'Features and pricing comparison'
        });
      }
      // 7개 넘으면 자르기
      trends.splice(7);
    }

    // 월요일부터 일요일까지 날짜 계산
    const monday = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // 월요일로 이동
    monday.setDate(today.getDate() + diff);

    // 주제에 날짜 추가
    const topics = trends.map((trend, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);

      return {
        day: getDayName(index),
        date: date.toISOString().split('T')[0], // YYYY-MM-DD
        category: trend.category,
        name: trend.name,
        keywords: trend.keywords,
        focusPoint: trend.focusPoint
      };
    });

    // JSON 파일 저장
    const weekData = {
      week: weekNumber,
      generated: new Date().toISOString(),
      topics: topics
    };

    // 디렉토리 생성
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(weekData, null, 2), 'utf8');

    // HTML 파일도 생성
    const htmlPath = outputPath.replace('.json', '.html');
    const htmlContent = generateHtml(weekData);
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');

    console.log(`✅ Weekly topics generated!\n`);
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📁 HTML: ${htmlPath}\n`);
    console.log('📋 Topics:');
    topics.forEach((topic, index) => {
      console.log(`  ${index + 1}. [${topic.day}] ${topic.name}`);
    });

  } catch (error) {
    console.error('❌ Error generating weekly topics:', error.message);
    throw error;
  }
}

// 실행
generateWeeklyTopics();
