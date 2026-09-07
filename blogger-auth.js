import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import readline from 'readline';

const SCOPES = ['https://www.googleapis.com/auth/blogger'];
const TOKEN_PATH = './token.json';
const CREDENTIALS_PATH = './credentials.json';

// OAuth 인증
export async function authorize() {
  let credentials;

  try {
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
    credentials = JSON.parse(content);
  } catch (err) {
    throw new Error('credentials.json 파일을 찾을 수 없습니다. Google Cloud Console에서 다운로드하세요.');
  }

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // 기존 토큰 확인
  try {
    const token = fs.readFileSync(TOKEN_PATH, 'utf8');
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    // 토큰 없음 → 새로 인증
    return await getNewToken(oAuth2Client);
  }
}

// 새 토큰 발급
async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\n🔐 다음 URL을 브라우저에서 열어 인증하세요:');
  console.log(authUrl);
  console.log('\n인증 후 받은 코드를 입력하세요:');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('코드: ', async (code) => {
      rl.close();
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // 토큰 저장
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        console.log('✅ 토큰이 저장되었습니다:', TOKEN_PATH);

        resolve(oAuth2Client);
      } catch (err) {
        reject(new Error('인증 코드가 잘못되었습니다: ' + err.message));
      }
    });
  });
}

// Blog ID 가져오기
export async function getBlogId(auth, blogUrl) {
  const blogger = google.blogger({ version: 'v3', auth });

  try {
    const res = await blogger.blogs.getByUrl({
      url: blogUrl
    });

    return res.data.id;
  } catch (err) {
    throw new Error('Blog ID를 가져올 수 없습니다: ' + err.message);
  }
}

// 포스트 발행
export async function publishPost(auth, blogId, title, htmlContent, labels = []) {
  const blogger = google.blogger({ version: 'v3', auth });

  try {
    const res = await blogger.posts.insert({
      blogId: blogId,
      requestBody: {
        title: title,
        content: htmlContent,
        labels: labels
      }
    });

    console.log('✅ 포스트 발행 완료!');
    console.log('   URL:', res.data.url);

    return res.data;
  } catch (err) {
    throw new Error('포스트 발행 실패: ' + err.message);
  }
}
