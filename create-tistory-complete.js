import fs from 'fs';
import path from 'path';

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

// HTML 본문만 추출
let htmlNoStyle = html.replace(/<style>[\s\S]*?<\/style>/, '');
htmlNoStyle = htmlNoStyle.replace(/<head>[\s\S]*?<\/head>/, '');
htmlNoStyle = htmlNoStyle.replace(/<!DOCTYPE[^>]*>/gi, '');
htmlNoStyle = htmlNoStyle.replace(/<\/?html[^>]*>/gi, '');
htmlNoStyle = htmlNoStyle.replace(/<\/?body[^>]*>/gi, '');

// CSS + HTML 합치기
const completeHtml = `<style>
${css}
</style>

${htmlNoStyle.trim()}`;

// 저장
const completeFile = path.join(blogDir, 'tistory-complete.html');
fs.writeFileSync(completeFile, completeHtml, 'utf8');

console.log('✅ 티스토리 완전판 생성 완료!');
console.log('📁 파일:', completeFile);
console.log('\n📋 사용 방법:');
console.log('1. 티스토리 글쓰기 → HTML 모드');
console.log('2. tistory-complete.html 내용 전체 복사/붙여넣기');
console.log('3. 완료! (CSS도 자동으로 포함됨)');
