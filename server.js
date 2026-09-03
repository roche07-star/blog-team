import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3200;

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// 전문가 페르소나 정의
const PERSONAS = {
  nero: {
    name: '네로',
    platform: '네이버 블로그',
    style: `당신은 10년차 네이버 블로거 "네로"입니다.

특징:
- 200만 구독자를 보유한 네이버 블로그 최고 전문가
- 감성적이고 친근한 스토리텔링이 특기
- 이미지와 함께 읽기 쉬운 문단 구성
- 검색 최적화를 위한 키워드 자연스럽게 배치
- 읽는 사람이 공감할 수 있는 따뜻한 톤

글 작성 시:
1. 친근한 인사로 시작
2. 개인적 경험이나 스토리 포함
3. 짧은 문단, 많은 줄바꿈
4. 이모지 적절히 활용
5. "여러분", "우리" 같은 포용적 표현
6. 마지막에 따뜻한 마무리`,
  },
  tiro: {
    name: '티로',
    platform: '티스토리',
    style: `당신은 12년차 티스토리 블로거 "티로"입니다.

특징:
- 150만 구독자를 보유한 티스토리 SEO 마스터
- 전문적이고 깊이있는 분석이 특기
- 데이터와 근거 중심의 논리적 글
- 목차, 소제목 활용한 체계적 구성
- 검색엔진 최적화를 고려한 키워드 배치

글 작성 시:
1. 명확한 목차 구성
2. 데이터, 통계, 사례 인용
3. 논리적이고 체계적인 흐름
4. H2, H3 소제목으로 구조화
5. 전문적이지만 이해하기 쉬운 설명
6. 요약과 액션 아이템으로 마무리`,
  },
  linker: {
    name: '링커',
    platform: '링크드인',
    style: `당신은 링크드인 전문가 "링커"입니다.

특징:
- 추천 10만명을 보유한 링크드인 인플루언서
- 비즈니스 중심의 인사이트가 특기
- 전문성과 실용성을 동시에 갖춘 콘텐츠
- 명확한 메시지와 CTA(행동 유도)
- 프로페셔널한 톤

글 작성 시:
1. 강력한 훅(Hook)으로 시작
2. 비즈니스 인사이트와 실전 조언
3. 간결하고 임팩트 있는 문장
4. 번호나 포인트로 핵심 정리
5. 전문적이면서 접근 가능한 톤
6. 명확한 CTA로 마무리`,
  }
};

// 콘텐츠 생성 API
app.post('/api/generate', async (req, res) => {
  try {
    const { persona, topic } = req.body;

    if (!persona || !topic) {
      return res.status(400).json({ error: '전문가와 주제를 선택해주세요' });
    }

    const selectedPersona = PERSONAS[persona];
    if (!selectedPersona) {
      return res.status(400).json({ error: '올바른 전문가를 선택해주세요' });
    }

    const prompt = `${selectedPersona.style}

주제: ${topic}

위 주제로 ${selectedPersona.platform} 플랫폼에 최적화된 블로그 글을 작성해주세요.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0].text;

    res.json({
      success: true,
      content,
      persona: selectedPersona.name,
      platform: selectedPersona.platform
    });

  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: '콘텐츠 생성 실패' });
  }
});

// 콘텐츠 분석 API
app.post('/api/analyze', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: '분석할 콘텐츠를 입력해주세요' });
    }

    const prompt = `다음 블로그 콘텐츠를 분석해주세요:

${content}

다음 항목을 0-100점으로 평가하고, 각 항목별 개선 제안을 해주세요:

1. SEO 점수 (검색엔진 최적화)
   - 키워드 사용
   - 제목 및 구조
   - 메타 요소

2. 가독성 점수
   - 문장 길이
   - 단락 구성
   - 전체 흐름

3. 참여도 점수 (Engagement)
   - 흥미 유발
   - 감정적 연결
   - 행동 유도

JSON 형식으로 답변해주세요:
{
  "seo": 점수,
  "readability": 점수,
  "engagement": 점수,
  "seo_feedback": "구체적 피드백",
  "readability_feedback": "구체적 피드백",
  "engagement_feedback": "구체적 피드백",
  "overall_feedback": "전체 평가 및 주요 개선 사항"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!analysis) {
      throw new Error('분석 결과 파싱 실패');
    }

    res.json({
      success: true,
      ...analysis
    });

  } catch (error) {
    console.error('Error analyzing content:', error);
    res.status(500).json({ error: '콘텐츠 분석 실패' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 블로팀 서버 실행 중: http://localhost:${PORT}`);
});
