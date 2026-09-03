import { useState } from 'react'
import './App.css'

const PERSONAS = [
  {
    id: 'nero',
    name: '네로',
    platform: '네이버 블로그',
    experience: '10년차',
    subscribers: '200만명',
    color: '#03C75A',
    specialty: '감성적이고 친근한 스토리텔링',
    description: '네이버 블로그 최적화 전문가'
  },
  {
    id: 'tiro',
    name: '티로',
    platform: '티스토리',
    experience: '12년차',
    subscribers: '150만명',
    color: '#FF5544',
    specialty: '전문적이고 깊이있는 분석',
    description: '티스토리 SEO 마스터'
  },
  {
    id: 'linker',
    name: '링커',
    platform: '링크드인',
    experience: '프로페셔널',
    subscribers: '추천 10만명',
    color: '#0A66C2',
    specialty: '비즈니스 중심 인사이트',
    description: '링크드인 성장 전문가'
  }
]

function App() {
  const [selectedPersona, setSelectedPersona] = useState(null)
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('write') // write, analyze

  const handleGenerate = async () => {
    if (!selectedPersona || !topic) {
      alert('전문가와 주제를 선택해주세요!')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona: selectedPersona,
          topic,
          action: 'write'
        })
      })

      const data = await response.json()
      setContent(data.content)
    } catch (error) {
      console.error('Error:', error)
      alert('콘텐츠 생성 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!content) {
      alert('분석할 콘텐츠를 입력해주세요!')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      const data = await response.json()
      alert(`분석 결과:\n\nSEO 점수: ${data.seo}/100\n가독성: ${data.readability}/100\n참여도: ${data.engagement}/100`)
    } catch (error) {
      console.error('Error:', error)
      alert('분석 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 블로팀</h1>
        <p>AI 전문가와 함께하는 블로그 콘텐츠 도구</p>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'write' ? 'active' : ''}`}
          onClick={() => setActiveTab('write')}>
          ✍️ 콘텐츠 작성
        </button>
        <button
          className={`tab ${activeTab === 'analyze' ? 'active' : ''}`}
          onClick={() => setActiveTab('analyze')}>
          📊 콘텐츠 분석
        </button>
      </div>

      {activeTab === 'write' && (
        <div className="content">
          <section className="persona-section">
            <h2>전문가 선택</h2>
            <div className="persona-grid">
              {PERSONAS.map(persona => (
                <div
                  key={persona.id}
                  className={`persona-card ${selectedPersona === persona.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPersona(persona.id)}
                  style={{ borderColor: selectedPersona === persona.id ? persona.color : '#ddd' }}>
                  <h3 style={{ color: persona.color }}>{persona.name}</h3>
                  <div className="persona-info">
                    <div><strong>{persona.platform}</strong></div>
                    <div>{persona.experience} • {persona.subscribers}</div>
                    <div className="specialty">{persona.specialty}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="input-section">
            <h2>주제 입력</h2>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="작성하고 싶은 주제를 입력하세요&#10;예: AI를 활용한 생산성 향상 방법"
              rows={3}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !selectedPersona || !topic}
              className="generate-btn">
              {loading ? '⏳ 생성 중...' : '✨ 콘텐츠 생성'}
            </button>
          </section>

          {content && (
            <section className="output-section">
              <h2>생성된 콘텐츠</h2>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={15}
                className="output-textarea"
              />
              <div className="output-actions">
                <button onClick={() => navigator.clipboard.writeText(content)}>
                  📋 복사하기
                </button>
                <button onClick={() => setContent('')}>
                  🗑️ 지우기
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === 'analyze' && (
        <div className="content">
          <section className="analyze-section">
            <h2>콘텐츠 분석</h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="분석할 콘텐츠를 입력하세요"
              rows={15}
              className="analyze-textarea"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !content}
              className="analyze-btn">
              {loading ? '⏳ 분석 중...' : '🔍 분석하기'}
            </button>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
