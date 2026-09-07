import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const prompt = `당신은 블로그 전문가 3명의 회의를 진행하는 퍼실리테이터입니다.

참석자:
1. 네로 - 10년차 네이버 블로거 (구독자 200만명)
   - 특기: 감성적 스토리텔링, 검색 최적화
   - 관점: 대중성, 공감, 바이럴

2. 티로 - 12년차 티스토리 블로거 (구독자 150만명)
   - 특기: 전문적 분석, SEO, 데이터 기반
   - 관점: 정보의 깊이, 검색 유입, 전문성

3. 링커 - 링크드인 전문가 (추천 10만명)
   - 특기: 비즈니스 인사이트, 실용성
   - 관점: 실전 활용, 커리어 성장, ROI

현재 상황:
- 이미 작성된 주제: JD 분석, 면접 가이드, 시니어 재취업, 자기소개서
- 대기 중인 주제: 경력 전환, 직무별 취업 전략(개발자/기획자/디자이너), 포트폴리오, 신입 vs 경력

회의 주제: 다음 블로그 주제 선정 - 구독자를 가장 많이 늘릴 수 있는 주제는?

각 전문가가:
1. 자신의 플랫폼 관점에서 주제 제안 (1-2개)
2. 왜 그 주제가 구독자 증가에 효과적인지 근거 제시
3. 다른 전문가 의견에 대한 반응
4. 최종 합의

회의록 형식으로 작성하되, 각자의 개성이 드러나도록 해주세요.`;

const message = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 4000,
  messages: [{
    role: 'user',
    content: prompt
  }]
});

console.log(message.content[0].text);
