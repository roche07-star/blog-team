import fs from 'fs';
import path from 'path';

const blogDir = 'C:/project/blog-team/blogspot/20260905';
const krFile = path.join(blogDir, 'AI-Productivity-Suites_KR.html');

const html = fs.readFileSync(krFile, 'utf8');

// 본문만 추출
let content = html.replace(/<style>[\s\S]*?<\/style>/, '');
content = content.replace(/<head>[\s\S]*?<\/head>/, '');
content = content.replace(/<!DOCTYPE[^>]*>/gi, '');
content = content.replace(/<\/?html[^>]*>/gi, '');
content = content.replace(/<\/?body[^>]*>/gi, '');
content = content.replace(/<div class="container">/gi, '');
content = content.replace(/<\/div>\s*$/gi, '');

// 티스토리용 심플 CSS
const simpleCss = `
/* 티스토리용 심플 디자인 */
.blog-wrapper {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
}

.blog-hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px 30px;
    border-radius: 8px;
    margin-bottom: 30px;
}

.blog-hero h1 {
    font-size: 1.8em;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 15px;
}

.blog-meta {
    font-size: 0.9em;
    opacity: 0.9;
}

.blog-section {
    margin: 30px 0;
}

.blog-section h2 {
    font-size: 1.6em;
    font-weight: 600;
    margin: 30px 0 15px 0;
    color: #1a1a2e;
    border-left: 4px solid #667eea;
    padding-left: 15px;
}

.blog-section h3 {
    font-size: 1.3em;
    font-weight: 600;
    margin: 25px 0 10px 0;
    color: #667eea;
}

.blog-pros-cons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin: 20px 0;
}

.blog-pros, .blog-cons {
    padding: 20px;
    border-radius: 8px;
    border-left: 4px solid;
}

.blog-pros {
    background: #f0fdf4;
    border-left-color: #10b981;
}

.blog-cons {
    background: #fef2f2;
    border-left-color: #ef4444;
}

.blog-pros h4, .blog-cons h4 {
    font-size: 1.1em;
    font-weight: 600;
    margin-bottom: 10px;
}

.blog-pros ul, .blog-cons ul {
    list-style: none;
    padding: 0;
}

.blog-pros li::before {
    content: "+ ";
    color: #10b981;
    font-weight: 700;
    margin-right: 5px;
}

.blog-cons li::before {
    content: "- ";
    color: #ef4444;
    font-weight: 700;
    margin-right: 5px;
}

.blog-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    overflow-x: auto;
    display: block;
}

.blog-table table {
    width: 100%;
    min-width: 600px;
}

.blog-table th {
    background: #667eea;
    color: white;
    padding: 12px;
    text-align: left;
    font-weight: 600;
}

.blog-table td {
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
}

.blog-table tr:nth-child(even) {
    background: #f9fafb;
}

.blog-highlight {
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    padding: 20px;
    margin: 20px 0;
    border-radius: 8px;
}

.blog-card {
    background: white;
    padding: 25px;
    border-radius: 8px;
    border-left: 4px solid #667eea;
    margin: 20px 0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
    .blog-hero h1 {
        font-size: 1.5em;
    }
    
    .blog-pros-cons {
        grid-template-columns: 1fr;
    }
    
    .blog-table {
        overflow-x: scroll;
    }
}
`;

// HTML 클래스명 변경
content = content.replace(/class="hero"/g, 'class="blog-hero"');
content = content.replace(/class="metadata"/g, 'class="blog-meta"');
content = content.replace(/class="tool-card/g, 'class="blog-card');
content = content.replace(/class="pros-cons"/g, 'class="blog-pros-cons"');
content = content.replace(/class="pros"/g, 'class="blog-pros"');
content = content.replace(/class="cons"/g, 'class="blog-cons"');
content = content.replace(/class="comparison-wrapper"/g, 'class="blog-table"');
content = content.replace(/class="comparison-table"/g, 'class="blog-table"');
content = content.replace(/class="pullquote"/g, 'class="blog-highlight"');
content = content.replace(/class="verdict-card"/g, 'class="blog-card"');

// 최종 HTML
const finalHtml = `<style>
${simpleCss}
</style>

<div class="blog-wrapper">
${content.trim()}
</div>`;

// 저장
const outputFile = path.join(blogDir, 'tistory-simple.html');
fs.writeFileSync(outputFile, finalHtml, 'utf8');

console.log('✅ 티스토리 심플 버전 생성 완료!');
console.log('📁 파일:', outputFile);
console.log('\n✨ 특징:');
console.log('- CSS 최소화 (티스토리 친화적)');
console.log('- 반응형 디자인');
console.log('- 테이블 가로 스크롤');
console.log('- 모바일 최적화');
