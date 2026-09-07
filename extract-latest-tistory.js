import fs from 'fs';
import path from 'path';

// 가장 최근 한글 HTML 파일 찾기
const blogDir = 'C:/project/blog-team/blogspot/20260905';
const krFile = path.join(blogDir, 'AI-Productivity-Suites_KR.html');

const html = fs.readFileSync(krFile, 'utf8');

// CSS 추출
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) {
  console.log('❌ CSS 찾을 수 없음');
  process.exit(1);
}

const css = styleMatch[1];

// HTML에서 <style> 태그 제거하고 본문만 추출
let htmlNoStyle = html.replace(/<style>[\s\S]*?<\/style>/, '');
htmlNoStyle = htmlNoStyle.replace(/<head>[\s\S]*?<\/head>/, '');
htmlNoStyle = htmlNoStyle.replace(/<!DOCTYPE[^>]*>/gi, '');
htmlNoStyle = htmlNoStyle.replace(/<\/?html[^>]*>/gi, '');
htmlNoStyle = htmlNoStyle.replace(/<\/?body[^>]*>/gi, '');

// 저장
const cssFile = path.join(blogDir, 'tistory-latest.css');
const htmlFile = path.join(blogDir, 'tistory-latest-content.html');

fs.writeFileSync(cssFile, css.trim(), 'utf8');
fs.writeFileSync(htmlFile, htmlNoStyle.trim(), 'utf8');

console.log('✅ 최신 티스토리용 파일 생성 완료!');
console.log('📁 CSS:', cssFile);
console.log('📁 HTML:', htmlFile);
console.log('\n📋 사용 방법:');
console.log('1. tistory-latest.css → 티스토리 스킨 편집 → CSS에 추가');
console.log('2. tistory-latest-content.html → 티스토리 글쓰기 → HTML 모드에 붙여넣기');
