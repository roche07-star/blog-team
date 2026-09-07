import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const topic = "2026 직무별 포트폴리오 작성 완벽 가이드";

// 네로 스타일 (네이버)
const neroPrompt = `당신은 네로입니다. 10년차 네이버 블로거로 구독자 200만명을 보유한 전문가입니다.

**특기**: 감성적이고 친근한 스토리텔링
**스타일**:
- 공감을 이끌어내는 도입부
- 개인적 경험과 에피소드 포함
- 친근하고 따뜻한 말투
- 독자가 "나의 이야기"처럼 느끼게 만들기

주제: ${topic}

감성적이면서도 실용적인 네이버 블로그 글을 작성해주세요.
- 도입부: 포트폴리오로 고민했던 개인적 경험 (감성적)
- 본문: 직무별 포트폴리오 핵심 요소 (실용적)
- 마무리: 독자에게 힘이 되는 메시지

길이: 2000-2500자`;

// 티로 스타일 (티스토리)
const tiroPrompt = `당신은 티로입니다. 12년차 티스토리 블로거로 구독자 150만명을 보유한 전문가입니다.

**특기**: 전문적이고 깊이있는 분석, SEO 최적화
**스타일**:
- 데이터와 통계 기반
- 검색 최적화된 구조
- 체계적이고 논리적인 전개
- 실전 활용 가능한 구체적 가이드

주제: ${topic}

SEO 최적화된 티스토리 블로그 글을 작성해주세요.
- 제목: 연도(2026) + 직군 키워드 포함
- 도입부: 통계/데이터로 주제의 중요성 강조
- 본문: 직무별(개발자/기획자/디자이너) 포트폴리오 전략 상세 분석
- 체크리스트, 템플릿 제공
- 마무리: 다음 시리즈 예고

길이: 2500-3000자`;

async function generateContent() {
  console.log('📝 콘텐츠 생성 시작...\n');

  // 네로 스타일
  console.log('🖊️ 네로 (네이버) 스타일 생성 중...');
  const neroResponse = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: neroPrompt
    }]
  });

  const neroContent = neroResponse.content[0].text;

  // 티로 스타일
  console.log('📊 티로 (티스토리) 스타일 생성 중...');
  const tiroResponse = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: tiroPrompt
    }]
  });

  const tiroContent = tiroResponse.content[0].text;

  // 결과 저장
  const output = `# 블로그 콘텐츠 생성 결과

생성 일시: ${new Date().toLocaleString('ko-KR')}
주제: ${topic}

---

## 🖊️ 네로 버전 (네이버 블로그)

${neroContent}

---

## 📊 티로 버전 (티스토리)

${tiroContent}

---

# 사용 가이드

1. **네이버 블로그**: 네로 버전 복사 → 감성적 공감 중심
2. **티스토리**: 티로 버전 복사 → SEO 최적화 중심
3. 필요시 두 버전을 믹스해서 사용 가능

생성 완료! 🎉
`;

  fs.writeFileSync('C:\\Users\\ROCHE\\AppData\\Local\\Temp\\claude\\c--project-headhunter-app\\84fb3e09-dfe1-4f36-bc4f-cbbfe9d39fe3\\scratchpad\\blog-content.md', output, 'utf8');

  console.log('\n✅ 생성 완료!');
  console.log('📄 파일 저장: scratchpad/blog-content.md\n');
  console.log('='.repeat(80));
  console.log(output);
}

generateContent().catch(console.error);
