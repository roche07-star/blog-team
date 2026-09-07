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

let css = styleMatch[1];

// 티스토리용 CSS 수정
css = css.replace(/\* \{[\s\S]*?\}/g, ''); // 리셋 CSS 제거
css = css.replace(/body \{[\s\S]*?\}/g, ''); // body 스타일 제거
css = css.replace(/\.container \{[\s\S]*?\}/g, '.container { max-width: 100%; margin: 0; padding: 0; }'); // 컨테이너 폭 100%

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
const completeFile = path.join(blogDir, 'tistory-fixed.html');
fs.writeFileSync(completeFile, completeHtml, 'utf8');

console.log('✅ 티스토리 수정판 생성 완료!');
console.log('📁 파일:', completeFile);
console.log('\n✨ 수정 사항:');
console.log('- .container 폭: 900px → 100%');
console.log('- 리셋 CSS 제거');
console.log('- body 스타일 제거');
