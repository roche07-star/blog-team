import { authorize, getBlogId } from './blogger-auth.js';
import fs from 'fs';

const authCode = '4/0ATsMZqBlCFMJH_BLkz4L2IfSJ5KWz3gOn1E7oDAW9ZCY7qdqFT7zzdgjcW1edLEnGzYQKg';

async function getToken() {
  try {
    console.log('🔐 인증 코드로 토큰 발급 중...\n');

    // credentials.json 읽기
    const credentials = JSON.parse(fs.readFileSync('C:/project/blog-team/credentials.json', 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.installed;

    // OAuth2 클라이언트 생성
    const { google } = await import('googleapis');
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // 토큰 발급
    const { tokens } = await oAuth2Client.getToken(authCode);
    oAuth2Client.setCredentials(tokens);

    // 토큰 저장
    fs.writeFileSync('C:/project/blog-team/token.json', JSON.stringify(tokens, null, 2));
    console.log('✅ 토큰 저장 완료: C:/project/blog-team/token.json\n');

    // Blog ID 확인
    const blogUrl = 'https://ai-toolkit-blog.blogspot.com/';
    const blogId = await getBlogId(oAuth2Client, blogUrl);
    console.log('✅ Blog ID:', blogId);
    console.log('\n🎉 자동화 설정 완료!\n');

  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

getToken();
