import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// 주제 순환 (jobizic 기능 분석 포함)
const TOPICS = [
  {
    name: '취업',
    keywords: '신입 개발자 취업 준비, 포트폴리오 작성, 면접 대비',
    jobizicFeature: 'JD 매칭 분석 기능으로 채용 공고와 이력서의 적합도를 0-100점으로 평가하고, 부족한 부분을 명확히 파악하여 서류 합격률을 높이는 방법'
  },
  {
    name: '이직',
    keywords: '경력 이직, 연봉 협상, 이력서 작성',
    jobizicFeature: 'AI 이력서 분석 기능으로 경력의 강점과 약점을 객관적으로 파악하고, 개선 포인트를 제시받아 효과적으로 어필할 수 있는 이력서를 작성하는 방법'
  },
  {
    name: '포트폴리오',
    keywords: '개발자 포트폴리오, GitHub 프로젝트, README 작성법',
    jobizicFeature: '이력서 분석 기능으로 자신의 핵심 강점 프로젝트와 기술 스택을 파악하고, 포트폴리오에서 어떤 경험을 부각해야 할지 구체적인 인사이트를 얻는 방법'
  },
  {
    name: '면접가이드',
    keywords: '기술 면접, 코딩 테스트, 인성 면접 준비',
    jobizicFeature: '면접 가이드 기능으로 JD와 이력서를 바탕으로 예상 질문을 도출하고, 답변 전략과 핵심 어필 포인트를 체계적으로 준비하는 방법'
  }
];

// 마지막으로 사용한 주제 인덱스 가져오기
function getLastTopicIndex() {
  const statePath = 'C:/project/blog-team/daily_blog/.state.json';
  try {
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      return state.lastTopicIndex || 0;
    }
  } catch (e) {
    console.error('상태 파일 읽기 실패:', e.message);
  }
  return 0;
}

// 마지막 주제 인덱스 저장
function saveLastTopicIndex(index) {
  const statePath = 'C:/project/blog-team/daily_blog/.state.json';
  try {
    fs.writeFileSync(statePath, JSON.stringify({ lastTopicIndex: index, lastRun: new Date().toISOString() }), 'utf8');
  } catch (e) {
    console.error('상태 파일 저장 실패:', e.message);
  }
}

// 가장 최근 블로그 글 읽기
function getLastBlogPost() {
  const dir = 'C:/project/blog-team/daily_blog';
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.md') && !f.startsWith('.'))
      .sort()
      .reverse();

    if (files.length > 0) {
      const lastFile = path.join(dir, files[0]);
      const content = fs.readFileSync(lastFile, 'utf8');
      return { filename: files[0], content };
    }
  } catch (e) {
    console.log('이전 글 없음 (첫 번째 글)');
  }
  return null;
}

async function generateBlogPost() {
  try {
    // 다음 주제 선택 (순환)
    const lastIndex = getLastTopicIndex();
    const nextIndex = (lastIndex + 1) % TOPICS.length;
    const topic = TOPICS[nextIndex];

    // 이전 글 읽기
    const lastPost = getLastBlogPost();

    console.log(`\n📝 주제: ${topic.name}`);
    console.log(`🔑 키워드: ${topic.keywords}`);
    if (lastPost) {
      console.log(`📄 이전 글: ${lastPost.filename}\n`);
    } else {
      console.log(`📄 첫 번째 글 생성\n`);
    }

    let prompt = `당신은 티로입니다. 12년차 티스토리 블로거로 구독자 150만명을 보유한 전문가입니다.

**특기**: 전문적이고 깊이있는 분석, SEO 최적화
**스타일**:
- 데이터와 통계 기반
- 검색 최적화된 구조
- 체계적이고 논리적인 전개
- 실전 활용 가능한 구체적 가이드

${lastPost ? `
**이전 글 참고**:
${lastPost.content.substring(0, 1000)}...

위 이전 글과 자연스럽게 연결되면서, 독자가 시리즈처럼 읽을 수 있게 작성해주세요.
이전 글에서 다룬 내용을 간단히 언급하고, 그 다음 단계나 관련 주제로 이어가세요.
` : ''}

주제: ${topic.name}
키워드: ${topic.keywords}

**jobizic 기능 분석 (이 내용을 본문에 자연스럽게 녹여주세요)**:
${topic.jobizicFeature}

위 주제로 SEO 최적화된 티스토리 블로그 글을 작성해주세요.
- 제목: 연도(2026) + 키워드 포함
- **🎣 후킹 (절대 중요!)**: 첫 문단부터 독자를 사로잡아야 합니다!
  → 충격적인 통계 ("85%가 실패한다", "평균 6초만에 탈락")
  → 반전되는 진실 ("사람들이 모르는 사실: 실력보다 ○○이 중요")
  → 구체적인 문제 제기 ("당신이 ○○하는 이유는...")
- 본문: 구체적이고 실용적인 가이드
- **핵심**: jobizic의 위 기능이 구직자 또는 헤드헌터에게 어떻게 도움되는지 구체적으로 분석하여 포함
- 체크리스트, 팁 제공
- 마무리: 핵심 요약

⚠️ **절대 중요: 100% 순수 HTML만 출력하세요!**

🚫 **마크다운 문법 절대 사용 금지!**

별표 두개로 감싸는 볼드 문법 절대 금지:
- ❌ 별표별표텍스트별표별표 (절대 금지!)
- ✅ <strong>텍스트</strong> (정답)

별표 한개로 감싸는 이탤릭 문법 절대 금지:
- ❌ 별표텍스트별표 (절대 금지!)
- ✅ <em>텍스트</em> (정답)

샵 기호 제목 문법 절대 금지:
- ❌ # 제목, ## 소제목 (절대 금지!)
- ✅ <h1>제목</h1>, <h2>소제목</h2> (정답)

하이픈 리스트 문법 절대 금지:
- ❌ - 리스트 (절대 금지!)
- ✅ <ul><li>리스트</li></ul> (정답)

**볼드체는 반드시 <strong>태그만!**
**이탤릭은 반드시 <em>태그만!**

첫 줄부터 바로 <h1>으로 시작하세요!

**🎨 Lucide 아이콘 사용하세요!**
이모지 대신 Lucide 아이콘을 적극 활용하세요:
- <i data-lucide="lightbulb"></i> 아이디어/팁
- <i data-lucide="check-circle"></i> 성공/완료
- <i data-lucide="x-circle"></i> 실패/금지
- <i data-lucide="alert-triangle"></i> 주의/경고
- <i data-lucide="target"></i> 목표/핵심
- <i data-lucide="trending-up"></i> 성장/증가
- <i data-lucide="users"></i> 사람/팀
- <i data-lucide="briefcase"></i> 업무/직무

예시:
<h2><i data-lucide="target"></i> 핵심 전략</h2>
<p><i data-lucide="lightbulb"></i> Tip: jobizic을 활용하면...</p>

올바른 시작 예시:
<h1><i data-lucide="briefcase"></i> 2026 신입 개발자 취업 준비 완벽 가이드</h1>
<p>2025년 사람인 조사에 따르면...</p>

틀린 시작 예시 (절대 금지):
(코드블록 시작 기호)
<h1>제목</h1>
(코드블록 끝 기호)

또는:
# 제목

**중요: 자연스러운 서비스 언급 + 링크 포함**
본문 중간에 **jobizic** 또는 **jobizic 서비스**의 구체적인 기능을 분석하며 자연스럽게 1-2회 언급해주세요.
**jobizic 언급 시 반드시 링크를 포함하세요**: <a href="http://jobizic.com" target="_blank">jobizic</a>
**참고 정보(언급하지는 말고 내부적으로만 참고)**: jobizic은 출시한 지 2개월 된 신규 서비스입니다. 따라서 "최근 주목받는", "초기 유저들의 긍정적 반응" 같은 뉘앙스로 작성하되, 구체적인 기간은 명시하지 마세요.

예시:
- "<a href="http://jobizic.com" target="_blank">jobizic</a>의 JD 분석 기능은 채용 공고에서 숨겨진 우선순위를 파악하여, 이력서에 어떤 키워드를 강조해야 할지 알려줍니다"
- "최근 주목받고 있는 <a href="http://jobizic.com" target="_blank">jobizic</a>은 AI 이력서 분석 기능으로 구직자가 자신의 강점을 효과적으로 어필하도록 도와줍니다"
- "무료로 제공되는 <a href="http://jobizic.com" target="_blank">jobizic</a>에서 JD 분석부터 맞춤 이력서 생성까지 한 번에 해결하면, 서류 합격률을 크게 높일 수 있습니다"

⚠️ 주의사항:
- 너무 노골적이지 않게, 정보 제공 문맥에서 자연스럽게 언급
- 광고처럼 느껴지지 않도록 팁이나 사례로 소개
- **jobizic의 구체적인 기능이 구직자/헤드헌터에게 어떻게 도움되는지 분석**하며 소개
- 전체 글의 흐름을 해치지 않는 선에서 배치
- **jobizic 언급 시 반드시 링크(<a> 태그) 포함!**

길이: 2000-2500자`;

    console.log('⏳ 티스토리 버전 생성 중...\n');

    const tistoryMessage = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const tistoryContent = tistoryMessage.content[0].text;

    // LinkedIn 버전 생성 (링커 스타일 - 짧고 임팩트 있게)
    console.log('⏳ LinkedIn 버전 생성 중...\n');

    const linkedinPrompt = `당신은 링커입니다. 링크드인 전문가로 추천 10만명을 보유한 인플루언서입니다.

**특기**: 비즈니스 중심 인사이트, 짧고 임팩트 있는 메시지
**스타일**:
- 강력한 훅(Hook)으로 시작
- 간결하고 임팩트 있는 문장
- 번호나 포인트로 핵심 정리
- 명확한 CTA로 마무리

${lastPost ? `
**이전 글 참고**:
${lastPost.content.substring(0, 500)}...

위 이전 글과 연결되는 내용으로 작성해주세요.
` : ''}

주제: ${topic.name}
키워드: ${topic.keywords}

**jobizic 기능 분석 (짧게 핵심만)**:
${topic.jobizicFeature}

LinkedIn용 짧은 포스트를 작성해주세요.
- 길이: 500-800자 (짧고 임팩트 있게)
- **🎣 후킹 (절대 중요!)**: 첫 줄이 전부입니다!
  → 도발적인 질문 ("왜 당신의 ○○은 실패할까요?")
  → 충격적인 사실 ("95%가 모르는 진실")
  → 반전 ("당신이 생각하는 그것, 완전히 틀렸습니다")
  → 3초 안에 스크롤을 멈추게 만들어야 합니다!
- 본문: 3-5개의 핵심 포인트 (번호나 이모지로 구분)
- **핵심**: jobizic의 위 기능이 구직자/헤드헌터에게 어떻게 도움되는지 간결하게 포함
- 마무리: 명확한 행동 유도 (CTA)

⚠️ **절대 중요: HTML 파일용이므로 순수 HTML만 출력하세요!**

🚫 **마크다운 문법 절대 사용 금지!**
- ❌ 별표별표텍스트별표별표 (절대 금지!) → ✅ <strong>텍스트</strong>
- ❌ # 제목 (절대 금지!) → ✅ <h1>제목</h1>
- ❌ ## 소제목 (절대 금지!) → ✅ <h2>소제목</h2>

**🎨 Lucide 아이콘 사용하세요!**
LinkedIn 비즈니스 아이콘:
- <i data-lucide="briefcase"></i> 업무/커리어
- <i data-lucide="trending-up"></i> 성장/성과
- <i data-lucide="target"></i> 목표/핵심
- <i data-lucide="lightbulb"></i> 아이디어/팁
- <i data-lucide="users"></i> 팀/네트워킹
- <i data-lucide="rocket"></i> 시작/성공
- <i data-lucide="award"></i> 성과/달성

예시:
<h1><i data-lucide="briefcase"></i> 경력 10년, 왜 당신은 탈락할까요?</h1>

<p><i data-lucide="trending-up"></i> 핵심 포인트</p>

<p><i data-lucide="lightbulb"></i> <strong>Tip:</strong> jobizic 활용하세요</p>

**중요: jobizic 자연스럽게 언급 + URL 포함**
jobizic 언급 시 반드시 URL을 함께 제시하세요: jobizic.com

예시:
- "💡 Tip: jobizic(jobizic.com)의 JD 분석 기능으로 채용 공고의 숨은 우선순위를 파악해보세요"
- "💡 jobizic의 이력서 분석으로 경력자의 임팩트를 정량화하세요 → jobizic.com"
- "더 알아보기: jobizic.com"
`;

    const linkedinMessage = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: linkedinPrompt
      }]
    });

    const linkedinContent = linkedinMessage.content[0].text;

    // 3. 네이버 블로그 버전 생성 (네로 스타일 - 감성적, 친근함)
    console.log('⏳ 네이버 블로그 버전 생성 중...\n');

    const naverPrompt = `당신은 로체입니다. 10년차 헤드헌터이자 네이버 블로거로 구독자 200만명을 보유한 전문가입니다.

**특기**: 담당했던 후보자 사례를 통한 감성적 스토리텔링
**스타일**:
- "제가 담당했던 ○○님의 이야기" 형식
- 헤드헌터 로체의 시점에서 후보자의 변화와 성장 스토리 전달
- 따뜻하고 친근한 톤
- 짧은 문단, 많은 줄바꿈
- 이모지 적절히 활용

${lastPost ? `
**이전 글 참고**:
${lastPost.content.substring(0, 500)}...

위 이전 글과 연결되는 내용으로 작성해주세요.
` : ''}

주제: ${topic.name}
키워드: ${topic.keywords}

**jobizic 기능 분석 (후보자 사례에 자연스럽게 녹여주세요)**:
${topic.jobizicFeature}

네이버 블로그용 글을 작성해주세요.
- 길이: 1500-2000자
- **🎣 후킹 (절대 중요!)**: 제목부터 클릭하고 싶게!
  → 후보자의 고백 ("면접 보면서 눈물 흘렸던 ○○님, 이제는 떨리지 않아요")
  → 변화와 성장 ("3개월 만에 달라진 ○○님의 비밀")
  → 감정 자극 ("제 손을 꼭 잡으시던 그 순간", "눈물로 시작한 이야기")
- **헤드헌터 시점**으로 "제가 담당했던 후보자분" 사례로 시작 (첫 3줄이 승부!)
- 짧은 문단 (2-3문장씩)
- 이모지 활용
- **핵심**: jobizic 기능을 후보자가 어떻게 활용했는지 사례로 소개

⚠️ **절대 중요: 100% 순수 HTML만 출력하세요!**

🚫 **마크다운 문법 절대 사용 금지!**
- ❌ 별표별표텍스트별표별표 (절대 금지!) → ✅ <strong>텍스트</strong>
- ❌ 별표텍스트별표 (절대 금지!) → ✅ <em>텍스트</em>
- ❌ # 제목 (절대 금지!) → ✅ <h1>제목</h1>

**볼드는 <strong>만 사용!**
**이탤릭은 <em>만 사용!**

첫 줄부터 바로 <h1>으로 시작!

**🎨 Lucide 아이콘 사용하세요!**
감성을 더하는 아이콘:
- <i data-lucide="heart"></i> 공감/마음
- <i data-lucide="smile"></i> 행복/긍정
- <i data-lucide="sparkles"></i> 특별함/반짝임
- <i data-lucide="star"></i> 중요/추천
- <i data-lucide="coffee"></i> 여유/일상
- <i data-lucide="thumbs-up"></i> 좋아요/추천

예시:
<h1><i data-lucide="heart"></i> 10년 차 직장인의 고백</h1>
<p><i data-lucide="sparkles"></i> 제가 최근에 발견한 꿀팁이에요!</p>

**중요: jobizic 친근하게 언급 + 링크 포함**
**jobizic 언급 시 반드시 링크를 포함하세요**: <a href="http://jobizic.com" target="_blank">jobizic</a>
**참고 정보(명시적으로 언급하지는 말 것)**: jobizic은 신규 서비스입니다. "제가 최근에 발견한", "후보자분께 추천했더니 반응이 좋았던" 같은 자연스러운 뉘앙스로 작성하세요.

예시:
- "제가 최근에 발견한 <a href="http://jobizic.com" target="_blank">jobizic</a>이라는 서비스가 정말 도움이 됐어요"
- "후보자분께 <a href="http://jobizic.com" target="_blank">jobizic</a>을 추천했는데, 정말 좋아하시더라고요"
- "<a href="http://jobizic.com" target="_blank">jobizic</a>의 이력서 분석 기능, 진짜 꿀팁이에요 ✨"
`;

    const naverMessage = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3500,
      messages: [{
        role: 'user',
        content: naverPrompt
      }]
    });

    const naverContent = naverMessage.content[0].text;

    // 파일명 생성 (날짜 + 주제)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    // 1. 티스토리 HTML 파일 저장
    const tistoryFilename = `${dateStr}_${topic.name}_티스토리.html`;
    const tistoryFilepath = path.join('C:/project/blog-team/daily_blog', tistoryFilename);

    const tistoryFileContent = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
  line-height: 1.9;
  color: #1a1a1a;
  max-width: 850px;
  margin: 0 auto;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 100%);
}
h1 {
  font-size: 34px;
  font-weight: 800;
  color: #1976d2;
  margin-bottom: 35px;
  line-height: 1.5;
  padding: 30px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 6px 25px rgba(25, 118, 210, 0.18);
  border-left: 6px solid #1976d2;
}
h2 {
  font-size: 26px;
  font-weight: 700;
  color: #0d47a1;
  margin-top: 45px;
  margin-bottom: 25px;
  padding: 18px 25px;
  background: linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%);
  border-radius: 14px;
  box-shadow: 0 3px 15px rgba(13, 71, 161, 0.12);
  border-left: 5px solid #1976d2;
}
h3 {
  font-size: 22px;
  font-weight: 600;
  color: #1565c0;
  margin-top: 30px;
  margin-bottom: 18px;
  padding: 15px 20px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #42a5f5;
}
p {
  margin-bottom: 18px;
  font-size: 17px;
  color: #263238;
  line-height: 1.95;
  padding: 15px 22px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.05);
}
ul, ol {
  margin: 25px 0;
  padding: 25px 25px 25px 50px;
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
  border-radius: 14px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
}
li {
  margin-bottom: 14px;
  font-size: 17px;
  color: #37474f;
  line-height: 1.85;
}
strong {
  color: #1976d2;
  font-weight: 700;
  background: linear-gradient(transparent 65%, rgba(25, 118, 210, 0.2) 65%);
  padding: 2px 4px;
}
.meta {
  background: linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%);
  padding: 22px;
  border-radius: 14px;
  margin-bottom: 40px;
  font-size: 15px;
  color: #546e7a;
  border: 2px solid #90caf9;
  box-shadow: 0 4px 18px rgba(25, 118, 210, 0.15);
}
/* Lucide 아이콘 스타일 */
i[data-lucide] {
  width: 22px;
  height: 22px;
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
  color: #1976d2;
  filter: drop-shadow(0 2px 5px rgba(25, 118, 210, 0.35));
}
h1 i[data-lucide] {
  width: 30px;
  height: 30px;
}
h2 i[data-lucide] {
  width: 26px;
  height: 26px;
}
a {
  color: #1976d2;
  text-decoration: none;
  font-weight: 700;
  border-bottom: 2px solid rgba(25, 118, 210, 0.35);
  padding: 2px 5px;
  transition: all 0.3s ease;
}
a:hover {
  border-bottom-color: #1976d2;
  background: rgba(25, 118, 210, 0.12);
  border-radius: 4px;
}
blockquote {
  margin: 25px 0;
  padding: 20px 25px;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-left: 5px solid #ff9800;
  border-radius: 10px;
  box-shadow: 0 3px 12px rgba(255, 152, 0, 0.15);
  font-style: italic;
  color: #e65100;
}
</style>
</head>
<body>
<div class="meta">
📅 생성일: ${today.toLocaleString('ko-KR')}<br>
🏷️ 주제: ${topic.name}<br>
🔑 키워드: ${topic.keywords}<br>
✍️ 스타일: 티로 (티스토리 SEO)
</div>

${tistoryContent}

<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
<script>
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
</script>
</body>
</html>
`;

    fs.writeFileSync(tistoryFilepath, tistoryFileContent, 'utf8');

    // 2. LinkedIn 텍스트 파일 저장
    const linkedinFilename = `${dateStr}_${topic.name}_LinkedIn.txt`;
    const linkedinFilepath = path.join('C:/project/blog-team/daily_blog', linkedinFilename);

    const linkedinFileContent = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 생성일: ${today.toLocaleString('ko-KR')}
🏷️ 주제: ${topic.name}
🔑 키워드: ${topic.keywords}
✍️ 스타일: 링커 (LinkedIn)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${linkedinContent}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Tip: LinkedIn에 복사/붙여넣기 하세요!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    fs.writeFileSync(linkedinFilepath, linkedinFileContent, 'utf8');

    // 3. LinkedIn HTML 파일 저장 (미리보기용 - Lucide 아이콘 포함)
    const linkedinHtmlFilename = `${dateStr}_${topic.name}_LinkedIn.html`;
    const linkedinHtmlFilepath = path.join('C:/project/blog-team/daily_blog', linkedinHtmlFilename);

    const linkedinHtmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: #000000e6;
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f3f2ef 0%, #e8f4f8 100%);
}
h1 {
  font-size: 26px;
  font-weight: 700;
  color: #0A66C2;
  margin-bottom: 25px;
  line-height: 1.4;
  padding: 25px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(10, 102, 194, 0.15);
  border-left: 5px solid #0A66C2;
}
h2 {
  font-size: 20px;
  font-weight: 600;
  color: #000000e6;
  margin-top: 30px;
  margin-bottom: 18px;
  padding: 15px 20px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #0A66C2;
}
p {
  margin-bottom: 16px;
  font-size: 15px;
  color: #000000e6;
  line-height: 1.7;
  padding: 14px 18px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
}
ul, ol {
  margin: 20px 0;
  padding: 20px 20px 20px 45px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}
li {
  margin-bottom: 12px;
  font-size: 15px;
  color: #000000e6;
  line-height: 1.6;
}
strong {
  color: #0A66C2;
  font-weight: 700;
}
.meta {
  background: linear-gradient(135deg, #ffffff 0%, #e8f4f8 100%);
  padding: 18px;
  border-radius: 10px;
  margin-bottom: 30px;
  font-size: 14px;
  color: #00000099;
  border: 2px solid #0A66C2;
  box-shadow: 0 3px 15px rgba(10, 102, 194, 0.12);
}
.note {
  background: linear-gradient(135deg, #fff9e6 0%, #ffe8b3 100%);
  padding: 15px 20px;
  border-radius: 8px;
  margin-top: 30px;
  border-left: 4px solid #f59e0b;
  font-size: 14px;
  color: #92400e;
}
/* Lucide 아이콘 스타일 */
i[data-lucide] {
  width: 20px;
  height: 20px;
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
  color: #0A66C2;
  filter: drop-shadow(0 2px 4px rgba(10, 102, 194, 0.3));
}
h1 i[data-lucide] {
  width: 26px;
  height: 26px;
}
h2 i[data-lucide] {
  width: 22px;
  height: 22px;
}
a {
  color: #0A66C2;
  text-decoration: none;
  font-weight: 600;
  border-bottom: 2px solid rgba(10, 102, 194, 0.3);
  transition: all 0.3s ease;
}
a:hover {
  border-bottom-color: #0A66C2;
  background: rgba(10, 102, 194, 0.1);
}
</style>
</head>
<body>
<div class="meta">
📅 생성일: ${today.toLocaleString('ko-KR')}<br>
🏷️ 주제: ${topic.name}<br>
🔑 키워드: ${topic.keywords}<br>
✍️ 스타일: 링커 (LinkedIn - HTML 미리보기)
</div>

${linkedinContent}

<div class="note">
💡 <strong>Tip:</strong> 위 내용을 LinkedIn에 올릴 때는 <strong>${linkedinFilename}</strong> 텍스트 파일을 열어서 복사/붙여넣기 하세요!
</div>

<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
<script>
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
</script>
</body>
</html>
`;

    fs.writeFileSync(linkedinHtmlFilepath, linkedinHtmlContent, 'utf8');

    // 3. 네이버 블로그 HTML 파일 저장
    const naverFilename = `${dateStr}_${topic.name}_네이버.html`;
    const naverFilepath = path.join('C:/project/blog-team/daily_blog', naverFilename);

    const naverFileContent = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
  line-height: 1.9;
  color: #2c3e50;
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8f5e9 100%);
}
h1 {
  font-size: 30px;
  font-weight: 800;
  color: #03C75A;
  margin-bottom: 30px;
  line-height: 1.5;
  padding: 25px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(3, 199, 90, 0.15);
  border-left: 5px solid #03C75A;
}
h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin-top: 40px;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #03C75A;
}
p {
  margin-bottom: 16px;
  font-size: 16px;
  color: #34495e;
  line-height: 1.9;
  padding: 12px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
}
ul, ol {
  margin: 20px 0;
  padding: 20px 20px 20px 45px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}
li {
  margin-bottom: 12px;
  font-size: 16px;
  color: #34495e;
  line-height: 1.8;
}
strong {
  color: #03C75A;
  font-weight: 700;
  background: linear-gradient(transparent 60%, rgba(3, 199, 90, 0.15) 60%);
}
.meta {
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 35px;
  font-size: 14px;
  color: #5a6c7d;
  border: 2px solid #e0e0e0;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.08);
}
/* Lucide 아이콘 스타일 */
i[data-lucide] {
  width: 20px;
  height: 20px;
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
  color: #03C75A;
  filter: drop-shadow(0 2px 4px rgba(3, 199, 90, 0.3));
}
h1 i[data-lucide] {
  width: 26px;
  height: 26px;
}
h2 i[data-lucide] {
  width: 24px;
  height: 24px;
}
a {
  color: #03C75A;
  text-decoration: none;
  font-weight: 600;
  border-bottom: 2px solid rgba(3, 199, 90, 0.3);
  transition: all 0.3s ease;
}
a:hover {
  border-bottom-color: #03C75A;
  background: rgba(3, 199, 90, 0.1);
}
</style>
</head>
<body>
<div class="meta">
📅 생성일: ${today.toLocaleString('ko-KR')}<br>
🏷️ 주제: ${topic.name}<br>
🔑 키워드: ${topic.keywords}<br>
✍️ 스타일: 네로 (네이버 블로그)
</div>

${naverContent}

<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
<script>
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
</script>
</body>
</html>
`;

    fs.writeFileSync(naverFilepath, naverFileContent, 'utf8');

    console.log('✅ 블로그 글 생성 완료!\n');
    console.log(`📁 티스토리: ${tistoryFilename}`);
    console.log(`📁 네이버: ${naverFilename}`);
    console.log(`📁 LinkedIn (텍스트): ${linkedinFilename}`);
    console.log(`📁 LinkedIn (HTML): ${linkedinHtmlFilename}`);
    console.log(`📍 위치: C:/project/blog-team/daily_blog/\n`);

    // 상태 저장 (다음번을 위해)
    saveLastTopicIndex(nextIndex);

    console.log(`🔄 다음 주제: ${TOPICS[(nextIndex + 1) % TOPICS.length].name}\n`);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

generateBlogPost();
