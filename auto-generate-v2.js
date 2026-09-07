import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const MODEL = 'claude-sonnet-4-5-20250929';

// 주제 목록 (jobizic 기능 정보 포함)
const TOPICS = [
  {
    name: '개발자 커리어 전환',
    keywords: '백엔드에서 프론트엔드 전환, PM 전환, 테크 리드 경로, 직무 전환 전략',
    jobizicFeatures: [
      'JD 매칭 분석: 전환하려는 직무와 현재 이력서의 적합도 평가',
      '이력서 분석: 새 직무로 전환 시 강점으로 활용 가능한 기존 경험 파악',
      '경력 인사이트: 커리어 전환 방향성과 필요한 역량 제시'
    ]
  },
  {
    name: '원격 근무 개발자',
    keywords: '글로벌 리모트, 해외 취업, 디지털 노마드, 재택 근무 개발자',
    jobizicFeatures: [
      'JD 매칭: 원격 근무 채용 공고와 이력서 적합도 분석',
      '이력서 분석: 원격 근무에 필요한 자기주도성과 커뮤니케이션 역량 파악',
      '면접 가이드: 원격 근무 면접에서 강조할 포인트 제공'
    ]
  },
  {
    name: '스타트업 vs 대기업',
    keywords: '첫 직장 선택, 조직 문화, 성장 경로, 커리어 방향성',
    jobizicFeatures: [
      'JD 매칭: 스타트업/대기업 각 채용 공고와의 적합도 비교',
      '이력서 분석: 어떤 조직 문화에 더 적합한 성향인지 인사이트 제공',
      '경력 인사이트: 장기적 커리어 성장에 맞는 선택지 제시'
    ]
  },
  {
    name: '프리랜서 개발자',
    keywords: '외주 프로젝트, 단가 협상, 프리랜서 생존 전략, 개인 사업자',
    jobizicFeatures: [
      'JD 매칭: 프리랜서 프로젝트 공고와 보유 기술 스택 적합도 분석',
      '이력서 분석: 프리랜서로 어필 가능한 핵심 강점 파악',
      '경력 인사이트: 프리랜서 시장에서 경쟁력 있는 포지셔닝 전략'
    ]
  },
  {
    name: '개발자 연봉 협상 실전',
    keywords: '연봉 테이블, 협상 화법, 오퍼 비교, 처우 협상 전략',
    jobizicFeatures: [
      'JD 매칭: 채용 공고 분석을 통한 예상 연봉 범위 파악',
      '이력서 분석: 연봉 협상 시 강점으로 내세울 수 있는 경력 발굴',
      '경력 인사이트: 시장 가치 대비 적정 연봉 수준 제시'
    ]
  },
  {
    name: '개발자 업무 효율화',
    keywords: 'AI 도구 활용, 자동화, 생산성 향상, Claude/ChatGPT 실전 활용',
    jobizicFeatures: [
      'AI 이력서 분석: AI 도구를 활용한 이력서 최적화 자동화',
      'JD 매칭: AI로 여러 채용 공고를 동시에 비교 분석',
      '면접 가이드: AI를 활용한 면접 예상 질문 자동 생성'
    ]
  }
];

// 상태 파일 경로
const STATE_PATH = 'C:/project/blog-team/daily_blog/.state.json';
const OUTPUT_DIR = 'C:/project/blog-team/daily_blog';

// ============================================================
// 유틸리티 함수
// ============================================================

function getLastTopicIndex() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
      return state.lastTopicIndex || 0;
    }
  } catch (e) {
    console.error('상태 파일 읽기 실패:', e.message);
  }
  return 0;
}

function saveLastTopicIndex(index) {
  try {
    fs.writeFileSync(STATE_PATH, JSON.stringify({
      lastTopicIndex: index,
      lastRun: new Date().toISOString()
    }), 'utf8');
  } catch (e) {
    console.error('상태 파일 저장 실패:', e.message);
  }
}

function getRecentBlogPosts() {
  const dir = OUTPUT_DIR;
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('_티스토리.html'))
      .sort()
      .reverse()
      .slice(0, 3); // 최근 3개

    return files.map(f => {
      const filePath = path.join(dir, f);
      const content = fs.readFileSync(filePath, 'utf8');
      // HTML에서 제목만 추출 (간단하게)
      const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : f;
      return { filename: f, title };
    });
  } catch (e) {
    console.log('이전 글 없음');
    return [];
  }
}

// ============================================================
// Phase 1: 팀 미팅 (주제 선정)
// ============================================================

async function teamMeeting() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 블로그 팀 미팅 시작');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const lastIndex = getLastTopicIndex();
  const nextIndex = (lastIndex + 1) % TOPICS.length;
  const recentPosts = getRecentBlogPosts();

  const meetingPrompt = `당신들은 블로그 팀입니다. 함께 다음 포스트 주제를 논의하세요.

**팀 구성:**
- **티로** (티스토리 블로거, 12년차, 구독자 150만명) - SEO 전문가, 깊이 있는 분석
- **로체** (네이버 블로거, 10년차 헤드헌터) - 실제 사례, 현장 인사이트
- **링커** (LinkedIn 전문가) - 짧고 강렬한 메시지, 비즈니스 관점

**이전 포스트:**
${recentPosts.length > 0 ? recentPosts.map((p, i) => `${i+1}. ${p.title} (${p.filename})`).join('\n') : '첫 번째 포스트'}

**다음 주제 후보:**
${TOPICS[nextIndex].name} (${TOPICS[nextIndex].keywords})

**jobizic 기능:**
${TOPICS[nextIndex].jobizicFeatures.map((f, i) => `${i+1}. ${f}`).join('\n')}

**논의 사항:**
1. 이 주제로 어떤 메시지를 전달할까?
2. jobizic 어떤 기능을 중점적으로 소개할까?
3. 후킹 전략은? (⚠️ 과도하지 않게, 자연스럽게!)
4. 각 플랫폼 특성에 맞는 접근법은?

티로, 로체, 링커가 **간단히** 의견을 나누고, 합의된 방향을 JSON으로 답변하세요.

**출력 형식 (JSON만):**
{
  "topic": "${TOPICS[nextIndex].name}",
  "coreMessage": "핵심 메시지 (1-2문장)",
  "jobizicFeature": "집중할 기능 (1개 선택)",
  "hookStrategy": "후킹 전략 (자연스럽게, 1문장)",
  "tistoryAngle": "티스토리 접근법 (1문장)",
  "naverAngle": "네이버 접근법 (1문장)",
  "linkedinAngle": "LinkedIn 접근법 (1문장)"
}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: 'user', content: meetingPrompt }]
  });

  const rawText = response.content.find(b => b.type === 'text')?.text || '{}';

  // JSON 추출 (마크다운 제거)
  let jsonText = rawText.replace(/```json|```/g, '').trim();

  // { }로 감싸진 JSON만 추출
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonText = jsonMatch[0];
  }

  const decision = JSON.parse(jsonText);

  console.log('✅ 팀 미팅 결과:');
  console.log(`  주제: ${decision.topic}`);
  console.log(`  핵심 메시지: ${decision.coreMessage}`);
  console.log(`  jobizic 기능: ${decision.jobizicFeature}`);
  console.log(`  후킹 전략: ${decision.hookStrategy}\n`);

  return { ...decision, topicIndex: nextIndex };
}

// ============================================================
// Phase 2: 독립 작성
// ============================================================

// 티로 - 티스토리 작성
async function tiroWriteTistory(decision) {
  console.log('🎨 티로 작성 중... (티스토리)');

  const prompt = `당신은 **티로**입니다. 12년차 티스토리 블로거, 구독자 150만명.

**이번 미팅 결과:**
- 주제: ${decision.topic}
- 핵심 메시지: ${decision.coreMessage}
- jobizic 기능: ${decision.jobizicFeature}
- 후킹 전략: ${decision.hookStrategy}
- 티스토리 접근: ${decision.tistoryAngle}

**당신의 전문성:**
- SEO 최적화 글쓰기
- 깊이 있는 분석과 데이터 기반 인사이트
- 구조화된 정보 전달

**작성 지침:**
1. **후킹**: ${decision.hookStrategy} (⚠️ 과하지 않게!)
2. **본문**: 핵심 인사이트 중심, **간결하게** (H2 섹션 3-4개 정도)
3. **jobizic 언급**: 본문 중간에 1-2회, 자연스럽게 (<a href="http://jobizic.com" target="_blank">jobizic</a>)
4. **구조**: H1 → H2 섹션 3-4개 → 간단한 마무리
5. **스타일**: 전문적, 신뢰감
6. **중요**: 반드시 **완성된 HTML**로 작성 (</html>까지)

**HTML 작성 규칙:**
- 순수 HTML만! 마크다운 절대 금지!
- Lucide 아이콘 사용 (<i data-lucide="icon-name"></i>)
- 아름다운 스타일 (gradient, shadow, card)
- 반응형 디자인

완성된 HTML을 출력하세요 (DOCTYPE부터 끝까지):`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,  // 티스토리는 긴 글이므로 8000으로 증가
    messages: [{ role: 'user', content: prompt }]
  });

  const html = response.content.find(b => b.type === 'text')?.text || '';
  console.log('  ✓ 티스토리 완료\n');
  return html;
}

// 로체 - 네이버 작성
async function rocheWriteNaver(decision) {
  console.log('💼 로체 작성 중... (네이버)');

  const prompt = `당신은 **로체**입니다. 10년차 헤드헌터이자 네이버 블로거.

**이번 미팅 결과:**
- 주제: ${decision.topic}
- 핵심 메시지: ${decision.coreMessage}
- jobizic 기능: ${decision.jobizicFeature}
- 후킹 전략: ${decision.hookStrategy}
- 네이버 접근: ${decision.naverAngle}

**당신의 전문성:**
- 실제 후보자 사례 기반 글쓰기
- 헤드헌터 현장 인사이트
- 공감과 진정성 있는 스토리텔링

**작성 지침:**
1. **후킹**: 실제 후보자 이야기로 시작 (${decision.hookStrategy})
2. **본문**: "제가 담당했던 ○○님" 형식, **간결한 스토리** (H2 섹션 3-4개)
3. **후보자 이름**: 다양하게 사용 (예: 지훈, 수연, 현우, 서영, 태양, 민지 등) - 매번 다른 이름!
4. **jobizic 언급**: 1-2회, "제가 최근 발견한" 느낌으로 (<a href="http://jobizic.com" target="_blank">jobizic</a>)
5. **톤**: 친근하고 따뜻한
6. **스타일**: 네이버 블로그 감성 (초록색 테마)
7. **중요**: 반드시 **완성된 HTML**로 작성 (</html>까지)

**HTML 작성 규칙:**
- 순수 HTML만! 마크다운 절대 금지!
- Lucide 아이콘 사용 (heart, sparkles, coffee 등)
- 네이버 초록 테마 (#03C75A)

완성된 HTML을 출력하세요:`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,  // 네이버도 긴 글이므로 8000으로 증가
    messages: [{ role: 'user', content: prompt }]
  });

  const html = response.content.find(b => b.type === 'text')?.text || '';
  console.log('  ✓ 네이버 완료\n');
  return html;
}

// 링커 - LinkedIn 작성 (HTML + TXT)
async function linkerWriteLinkedIn(decision) {
  console.log('🌐 링커 작성 중... (LinkedIn)');

  const prompt = `당신은 **링커**입니다. LinkedIn 전문가.

**이번 미팅 결과:**
- 주제: ${decision.topic}
- 핵심 메시지: ${decision.coreMessage}
- jobizic 기능: ${decision.jobizicFeature}
- LinkedIn 접근: ${decision.linkedinAngle}

**당신의 전문성:**
- 짧고 강렬한 메시지
- 비즈니스 관점
- 3초 안에 스크롤 멈추게 하기

**작성 지침:**
1. **언어**: 반드시 **한국어**로 작성! (영어 절대 금지)
2. **후킹**: 도발적 질문 또는 충격적 통계 (3초 안에!)
3. **본문**: 간결한 인사이트, 핵심만 (최대 300단어)
4. **jobizic 언급**: 1회, 실용적 팁으로 (<a href="http://jobizic.com" target="_blank">jobizic.com</a>)
5. **톤**: 프로페셔널, 임팩트 있게
6. **구조**: 후킹 → 3-5가지 포인트 → CTA

**2가지 버전 작성 (둘 다 한국어!):**
1. HTML 버전 (미리보기용, 한국어)
2. 텍스트 버전 (복사/붙여넣기용, 한국어)

JSON 형식으로 답변:
{
  "html": "완성된 HTML (한국어)",
  "text": "복사용 텍스트 (한국어, 마크다운 아님, 순수 텍스트)"
}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,  // LinkedIn은 4000으로 증가
    messages: [{ role: 'user', content: prompt }]
  });

  const rawText = response.content.find(b => b.type === 'text')?.text || '{}';
  const result = JSON.parse(rawText.replace(/```json|```/g, '').trim());

  console.log('  ✓ LinkedIn 완료\n');
  return result;
}

// ============================================================
// 메인 실행
// ============================================================

async function generateBlogPosts() {
  try {
    console.log('\n🚀 블로그 팀 자동 생성 시작 (v2 - 협업 모드)\n');

    // Phase 1: 팀 미팅
    const decision = await teamMeeting();

    // Phase 2: 병렬 작성
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✍️  각자 작성 시작 (독립 작업)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const [tistoryHtml, naverHtml, linkedinResult] = await Promise.all([
      tiroWriteTistory(decision),
      rocheWriteNaver(decision),
      linkerWriteLinkedIn(decision)
    ]);

    // Phase 3: 파일 저장
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const topicName = decision.topic;

    const tistoryPath = path.join(OUTPUT_DIR, `${timestamp}_${topicName}_티스토리.html`);
    const naverPath = path.join(OUTPUT_DIR, `${timestamp}_${topicName}_네이버.html`);
    const linkedinHtmlPath = path.join(OUTPUT_DIR, `${timestamp}_${topicName}_LinkedIn.html`);
    const linkedinTxtPath = path.join(OUTPUT_DIR, `${timestamp}_${topicName}_LinkedIn.txt`);

    fs.writeFileSync(tistoryPath, tistoryHtml, 'utf8');
    fs.writeFileSync(naverPath, naverHtml, 'utf8');
    fs.writeFileSync(linkedinHtmlPath, linkedinResult.html, 'utf8');
    fs.writeFileSync(linkedinTxtPath, linkedinResult.text, 'utf8');

    // 상태 저장
    saveLastTopicIndex(decision.topicIndex);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 모든 블로그 포스트 생성 완료!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`📁 저장 위치: ${OUTPUT_DIR}`);
    console.log(`  - ${path.basename(tistoryPath)}`);
    console.log(`  - ${path.basename(naverPath)}`);
    console.log(`  - ${path.basename(linkedinHtmlPath)}`);
    console.log(`  - ${path.basename(linkedinTxtPath)}\n`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

// 실행
generateBlogPosts();
