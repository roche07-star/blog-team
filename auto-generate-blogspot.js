import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { authorize, getBlogId, publishPost } from './blogger-auth.js';

// .env 파일이 있을 때만 로드 (로컬 개발용)
// GitHub Actions에서는 환경 변수가 이미 설정되어 있음
try {
  if (fs.existsSync('.env')) {
    const dotenv = await import('dotenv');
    dotenv.config();
  }
} catch (error) {
  console.log('Using environment variables (GitHub Actions mode)');
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const MODEL = 'claude-haiku-4-5-20251001';

const STATE_PATH = './발행/blogspot/.state.json';
const OUTPUT_DIR = './발행/blogspot';
const TOPICS_DIR = './주제목록';

// ============================================================
// 유틸리티 함수
// ============================================================

function ensureDirectoryExists() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

// 주 번호 계산 (ISO 8601)
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

// 오늘 날짜에 맞는 주제 가져오기
function getTodayTopic() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const weekNumber = getWeekNumber(today);
    const weekFile = path.join(TOPICS_DIR, `${weekNumber}.json`);

    if (!fs.existsSync(weekFile)) {
      console.error(`❌ No topics file found for ${weekNumber}`);
      console.error(`   Expected: ${weekFile}`);
      console.error(`   Please run: node generate-weekly-topics.js`);
      throw new Error(`Topics file not found: ${weekFile}`);
    }

    const weekData = JSON.parse(fs.readFileSync(weekFile, 'utf8'));
    const todayTopic = weekData.topics.find(t => t.date === todayStr);

    if (!todayTopic) {
      console.error(`❌ No topic found for ${todayStr} in ${weekNumber}`);
      throw new Error(`Topic not found for today: ${todayStr}`);
    }

    console.log(`📅 Using topic for ${todayTopic.day} (${todayStr})`);
    return todayTopic;

  } catch (e) {
    console.error('Error loading today\'s topic:', e.message);
    throw e;
  }
}

// ============================================================
// Perplexity API - 최신 정보 검색
// ============================================================

async function searchLatestInfo(topic) {
  console.log(`🔍 Searching latest info for: ${topic.name}`);

  const query = `${topic.name} latest updates September 2026 pricing features benchmarks official news announcements`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{
          role: 'system',
          content: 'You are a research assistant. Provide factual, up-to-date information with sources.'
        }, {
          role: 'user',
          content: query
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    console.log('  ✓ Latest info retrieved\n');
    return result;

  } catch (error) {
    console.error('  ✗ Perplexity search failed:', error.message);
    console.log('  → Proceeding without latest info\n');
    return 'No recent updates available. Use general knowledge.';
  }
}

// ============================================================
// Alex - AI Productivity 전문가
// ============================================================

async function alexWriteBlogPost(topic) {
  console.log('\n🤖 Alex writing... (AI Productivity Expert)');

  // 현재 날짜 가져오기
  const now = new Date();
  const currentMonth = now.toLocaleString('en-US', { month: 'long' });
  const currentYear = now.getFullYear();
  const currentDate = `${currentMonth} ${currentYear}`;

  // 최신 정보 검색 (Perplexity)
  const latestInfo = await searchLatestInfo(topic);

  const prompt = `You are **Roche P.**, a tech journalist who writes objective, fact-based AI tool comparisons.

**Author Information:**
- Name: Roche P.
- Style: Professional, data-driven, objective
- Always use "Roche P." in author byline

**CRITICAL - Current Date:**
- Today is: **${currentDate}**
- ALWAYS use this date in the article
- NEVER use outdated years (2024, 2025, etc.)
- Use "as of ${currentDate}" for pricing and features

**Latest Research (September 2026):**
${latestInfo}

**Your approach:**
- Use the LATEST RESEARCH above as primary source
- Fact-based analysis (no fabricated test results)
- Cite information from the research above
- Include pricing, features, updates from 2026
- Objective comparison, not personal claims

**Today's topic:**
- Category: ${topic.category}
- Title: ${topic.name}
- Keywords: ${topic.keywords}
- Focus: ${topic.focusPoint}

**Language & Localization (CRITICAL):**
- Write in **native US English** - natural, idiomatic expressions
- Think like a professional tech journalist, not a translator
- Use US examples (US companies, $ pricing, US tech scene)
- Conversational but factual tone
- Avoid stiff/formal phrasing that sounds translated
- Natural phrases: "Here's the breakdown..." "Let's compare..." "Bottom line?"

**Writing guidelines (FACT-BASED ONLY):**
1. **Hook**: Start with industry stat or provocative question (use real, verifiable data only!)
2. **Structure**:
   - Introduction (problem statement from industry trends)
   - Tool 1 Review (features, official pricing, documented use cases)
   - Tool 2 Review
   - Tool 3 Review (if applicable)
   - **RATING TABLE (REQUIRED)**: For EACH tool, include a rating table with scores based on documented data:
     * Ease of Use (X/10) - based on user reviews, documentation quality
     * AI Quality (X/10) - based on benchmarks, output quality reports
     * Features (X/10) - based on official feature lists
     * Speed (X/10) - based on performance data, user reports
     * Pricing (X/10) - based on value analysis (higher score = better value)
     * Value for Money (X/10) - overall ROI assessment
     * Overall (X.X/10) - average of above scores
   - Head-to-head comparison (table based on official specs)
   - Final verdict (which tool for which scenario - objective analysis)
   - Value proposition (based on official pricing/features, not fabricated ROI)

3. **CRITICAL - Do NOT fabricate:**
   - ❌ "I tested 50 queries" (you didn't test anything)
   - ❌ "In my tests, it scored 95%" (no fabricated test results)
   - ❌ "I spent a month using..." (no fake personal experience)
   - ✅ "According to official benchmarks..."
   - ✅ "The company states..."
   - ✅ "Based on documented features..."
   - ✅ "Industry reviews show..."

4. **Style**:
   - Conversational but professional (like a tech journalist)
   - Data-driven (use ONLY verifiable public data)
   - Honest (mention pros and cons from official docs/reviews)
   - Practical (real-world scenarios, not fabricated case studies)
   - Natural idioms: "game-changer", "worth considering", "deal-breaker"

5. **Date Usage (CRITICAL):**
   - Article date: **${currentDate}**
   - Author meta: Use ${currentMonth} ${currentYear}
   - Pricing: "as of ${currentDate}"
   - Never write "2024" or past years
   - Use "currently", "as of now", "in ${currentYear}"

6. **SEO**: Naturally include keywords
7. **Length**: 800-1200 words

**HTML Design Requirements (CRITICAL - Clean Modern Magazine Style):**

**NO EMOJIS - Use CSS visual elements only!**
- ❌ NO emojis at all (Blogger breaks them)
- ✅ CSS shapes, borders, colors for visual hierarchy
- ✅ Large bold typography
- ✅ Whitespace and clean layout
- ✅ Professional tech magazine aesthetic

**CRITICAL - NO EMPTY ELEMENTS (ABSOLUTE RULE):**
- ❌ NEVER create empty <div></div> tags
- ❌ NEVER create <div class="something"></div> without content inside
- ❌ NO placeholder boxes, skeleton screens, or empty containers
- ❌ NO decorative empty elements
- ❌ NO <div> tags that exist only for spacing (use CSS margin/padding instead)
- ✅ ONLY create elements that contain ACTUAL TEXT or CONTENT
- ✅ Every div must have real content between opening and closing tags
- ✅ If you need spacing, use CSS margin/padding, NOT empty divs

Example of FORBIDDEN (DO NOT DO THIS):
<div class="spacer"></div>
<div class="placeholder"></div>
<div></div>

Example of CORRECT:
<div class="section">
  <p>This div has actual content</p>
</div>

**Visual Design:**
- Gradient hero section (large, bold headline)
- Clean card-based layout with subtle shadows
- Colored left borders for sections (not emojis)
- Large section numbers (01, 02, 03)
- Tool logos as colored badges with initials
- Pros/Cons with colored backgrounds (green/red tints)
- Large pull quotes for key insights
- Stats in large colored boxes

**Typography (CRITICAL):**
- Hero headline: 3em, bold, dark
- Section headers: 2em with colored number prefix (01, 02)
- Subheaders: 1.5em, semi-bold
- Body: 1.1em, line-height 1.8
- Use font-weight variation (300, 400, 600, 700)
- Google Fonts: Poppins (headings) + Inter (body)

**Color System:**
- Background: #fafbfc (off-white)
- Text: #1a1a2e (dark blue-black)
- Primary: #667eea (purple-blue)
- Success: #10b981 (green)
- Warning: #f59e0b (orange)
- Danger: #ef4444 (red)
- Each tool gets a brand color stripe (Claude: #7c3aed, ChatGPT: #14b8a6, etc.)

**REQUIRED BASE CSS (MUST INCLUDE IN <style>):**
body {
  color: #333 !important;
  background: #ffffff !important;
}

h1, h2, h3, h4, h5, h6 {
  color: #1a1a2e !important;
}

p, li, span, div {
  color: #333 !important;
}

a {
  color: #667eea !important;
}

.post-body, .article, .post {
  background: #ffffff !important;
  color: #333 !important;
}

.container, .main-content, .post-content {
  background: #ffffff !important;
}

**Layout Components:**
1. **Hero Section**: Gradient background, large headline (3em), author + date + reading time (plain text)
2. **Metadata**: "By Roche P. | September 2026 | 8 min read" (simple text, NO icons)
3. **Section Cards**: White cards with 4px colored left border
4. **RATING TABLE (REQUIRED for each tool)**: Clean table with scores
   Example HTML:
   <table class="rating-table">
     <tr><th>Rating Category</th><th>Score</th></tr>
     <tr><td>Ease of Use</td><td>9/10</td></tr>
     <tr><td>AI Quality</td><td>8/10</td></tr>
     <tr><td>Features</td><td>9/10</td></tr>
     <tr><td>Speed</td><td>8/10</td></tr>
     <tr><td>Pricing</td><td>7/10</td></tr>
     <tr><td>Value for Money</td><td>8/10</td></tr>
     <tr><td><strong>Overall</strong></td><td><strong>8.2/10</strong></td></tr>
   </table>
   CSS: background white, border-collapse, alternating row colors, last row bold
5. **Pros/Cons Grid**: Two-column layout
   - Strengths: Light green background (#f0fdf4) + green left border (#10b981)
   - Limitations: Light red background (#fef2f2) + red left border (#ef4444)
6. **Comparison Table**: Clean table with alternating row colors
7. **Pull Quote Boxes**: Large text for key takeaways, colored border
8. **Final Verdict**: Large highlighted card with gradient

**Visual Elements (CSS only):**
- Section numbers: Large "01" "02" "03" in gradient (2.5em, font-weight 700, color: gradient)
- Tool badges: Colored circles with tool initials (e.g., "C" for Claude, "G" for GPT)
- Pros/Cons: ONLY use plain text "+" and "-" characters (NOT HTML entities, NOT special symbols)
- Dividers: Thin colored lines (1px solid #e5e7eb)
- Cards: box-shadow: 0 1px 3px rgba(0,0,0,0.12)

**CRITICAL - CHARACTER USAGE:**
- ✅ ONLY use plain ASCII characters: + - / | ( ) [ ] { }
- ❌ NEVER use HTML entities: &#8720; &#8712; &#8706; &minus; &plus; etc.
- ❌ NEVER use Unicode special characters
- ✅ For bullet points, use plain "+" or "-" or "•"
- ✅ Example: "+ Strength" NOT "&#8720; Strength"
- ✅ Example: "- Limitation" NOT "&#8712; Limitation"

**Mobile Responsive (CRITICAL - Must work perfectly on mobile!):**
- Container: width 100% !important, max-width 100% !important, NO max-width restrictions!
- Body font-size: 1rem on mobile (NOT 1.1em - too large!)
- Hero h1: 1.8em on mobile (readable but not overwhelming)
- Section padding: 15px on mobile (NOT 40px or 20px)
- Stack ALL grids/cards vertically on mobile
- Tables: Convert to responsive cards on mobile (NO tables on mobile!)
- Rating table: Stack vertically as list on mobile
- Long words: word-break: break-word
- Images: max-width: 100%, height: auto
- No horizontal scroll on body
- Test breakpoint: @media (max-width: 768px)
- Minimum touch target: 44px for buttons/links
- NO empty placeholder divs or boxes
- Remove ALL fixed widths on mobile

**Clean Code Requirements:**
- NO external libraries
- NO JavaScript
- Pure CSS visual design
- NO emojis or special characters
- Professional, readable, fast-loading
- Use <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet"> for fonts

**HIDE BLOGGER SIDEBAR (CRITICAL - Apply to ALL screen sizes):**
Add this CSS OUTSIDE any media query (applies to desktop and mobile):
- .sidebar, .sidebar-wrapper, .sidebar-container, aside { display: none !important; }
- .Profile, .BlogArchive, .Label, .ReportAbuse { display: none !important; }
- .main-content, .main-wrapper, .Blog, .post-outer { width: 100% !important; }

**Mobile CSS Rules (MUST INCLUDE in @media (max-width: 768px)):**
CRITICAL: On mobile, make content USE FULL WIDTH!
- body: font-size 1rem, margin 0, padding 0
- .container: width 100% !important, max-width 100% !important, padding 10px !important, margin 0 !important
- .hero: padding 20px 15px, width 100%
- .hero h1: font-size 1.6em, line-height 1.3
- .section, .tool-card: padding 15px, width 100%, box-sizing border-box
- h2: font-size 1.4em
- .pros-cons: display block (NOT grid), each item full width
- .pros, .cons: width 100%, margin-bottom 15px
- .rating-table: display none (hide table on mobile)
- .rating-mobile: display block (show mobile-friendly list instead)
- .comparison-table: display none (hide on mobile, show simplified version)
- table: display none on mobile (replace with card layout)
- p, li: word-break break-word
- ALL containers: max-width 100%, width 100%

HIDE SIDEBAR ON MOBILE (CRITICAL):
- .sidebar, .sidebar-wrapper, .sidebar-container, aside: display none !important
- .Profile, .BlogArchive, .Label, .ReportAbuse: display none !important
- .main-content, .main-wrapper, .Blog, .post-outer: width 100% !important

MOBILE RATING DISPLAY (use instead of table):
<div class="rating-mobile">
  <div class="rating-item"><span>Ease of Use:</span> <strong>9/10</strong></div>
  <div class="rating-item"><span>AI Quality:</span> <strong>8/10</strong></div>
  ... (repeat for all ratings)
</div>
CSS: .rating-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }

**FINAL CHECKLIST BEFORE GENERATING (MUST VERIFY):**
1. ✅ NO HTML entities (&#xxxx; or &name;) - ONLY plain text
2. ✅ NO empty <div></div> tags
3. ✅ Pros/Cons use ONLY "+" and "-" characters
4. ✅ Mobile: width 100%, max-width 100%
5. ✅ Rating table hidden on mobile, show rating-mobile instead
6. ✅ All content has actual text, no placeholders

**CRITICAL OUTPUT FORMAT:**
Write ONLY the post body content for Blogger.
- Start with <style> tags (CSS)
- Then content divs
- NO <!DOCTYPE html>
- NO <html> tags
- NO <head> tags
- NO <body> tags
- NO hero section with blog title (Blogger provides title)
- Start directly with article content

Example correct format:
<style>
  /* CSS here */
</style>

<div class="container">
  <p>Article starts here...</p>
  ...
</div>

Generate the blog post content:`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }]
  });

  let html = response.content.find(b => b.type === 'text')?.text || '';

  console.log('  ✓ Blogspot post (English) complete\n');
  return html;
}

// 한국어 번역 버전 생성 (이해용)
async function translateToKorean(englishHtml, topic) {
  console.log('🇰🇷 Translating to Korean...');

  const prompt = `Translate this English blog post to Korean.

**Original topic:** ${topic.name}

**Translation guidelines:**
- Keep HTML structure exactly the same
- Translate all content to natural Korean
- Keep technical terms in English when appropriate (e.g., ChatGPT, Claude, API)
- Maintain professional tone
- Keep links and formatting

**English HTML:**
${englishHtml}

Output the complete Korean HTML:`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }]
  });

  let koreanHtml = response.content.find(b => b.type === 'text')?.text || '';

  // HTML 엔티티를 직접 이모지로 변환 (한국어도 동일)
  const entityMap = {
    '&#9989;': '✅',
    '&#10060;': '❌',
    '&#9888;': '⚠️',
    '&#128176;': '💰',
    '&#9889;': '⚡',
    '&#128293;': '🔥',
    '&#128200;': '📊',
    '&#127919;': '🎯',
    '&#128100;': '👤',
    '&#128197;': '📅',
    '&#9200;': '⏱️',
    '&check;': '✅',
    '&cross;': '❌',
    '&times;': '❌'
  };

  Object.keys(entityMap).forEach(entity => {
    const regex = new RegExp(entity, 'g');
    koreanHtml = koreanHtml.replace(regex, entityMap[entity]);
  });

  console.log('  ✓ Korean translation complete\n');
  return koreanHtml;
}

// ============================================================
// 메인 실행
// ============================================================

async function generateBlogspotPost() {
  try {
    console.log('\n🚀 AI Productivity Tools Blogspot Generator\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    ensureDirectoryExists();

    // 오늘 주제 가져오기
    const topic = getTodayTopic();

    console.log(`\n📝 Topic: ${topic.name}`);
    console.log(`🏷️  Category: ${topic.category}`);
    console.log(`🔑 Keywords: ${topic.keywords}\n`);

    // Alex가 작성 (영어)
    const englishHtml = await alexWriteBlogPost(topic);

    // 한국어 번역 (이해용)
    const koreanHtml = await translateToKorean(englishHtml, topic);

    // 날짜 폴더 생성
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const dateFolder = path.join(OUTPUT_DIR, timestamp);
    if (!fs.existsSync(dateFolder)) {
      fs.mkdirSync(dateFolder, { recursive: true });
    }

    // 파일명
    const categorySlug = topic.category.replace(/\s+/g, '-');
    const englishFileName = `${categorySlug}_EN.html`;
    const koreanFileName = `${categorySlug}_KR.html`;

    // 파일 경로
    const englishPath = path.join(dateFolder, englishFileName);
    const koreanPath = path.join(dateFolder, koreanFileName);

    // ```html 마커 제거
    const cleanEnglishHtml = englishHtml
      .replace(/^```html\s*/g, '')
      .replace(/```\s*$/g, '');

    const cleanKoreanHtml = koreanHtml
      .replace(/^```html\s*/g, '')
      .replace(/```\s*$/g, '');

    // 파일 저장
    fs.writeFileSync(englishPath, cleanEnglishHtml, 'utf8');
    fs.writeFileSync(koreanPath, cleanKoreanHtml, 'utf8');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Blogspot posts generated!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`📁 Saved to: ${dateFolder}`);
    console.log(`  - ${englishFileName} (for Blogspot)`);
    console.log(`  - ${koreanFileName} (for review)\n`);

    // Blogger 자동 발행
    try {
      console.log('\n📤 Publishing to Blogger...');

      const auth = await authorize();
      const blogUrl = 'https://ai-toolkit-blog.blogspot.com/';
      const blogId = await getBlogId(auth, blogUrl);

      // 라벨 생성
      const labels = [topic.category];

      // 포스트 발행
      const postData = await publishPost(
        auth,
        blogId,
        topic.name,
        cleanEnglishHtml,
        labels
      );

      console.log(`   📍 Published: ${postData.url}\n`);

    } catch (error) {
      console.error('⚠️  Blogger 자동 발행 실패:', error.message);
      console.log('   파일은 저장되었으니 수동으로 발행하세요.\n');
    }

    console.log(`🔄 Next topic: ${AI_TOPICS[(nextIndex + 1) % AI_TOPICS.length].name}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// 실행
generateBlogspotPost();
