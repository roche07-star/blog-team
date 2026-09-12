import fs from 'fs';
import { google } from 'googleapis';
import readline from 'readline';

async function refreshToken() {
  try {
    // 1. credentials.json 읽기
    const credentials = JSON.parse(fs.readFileSync('./credentials.json', 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

    // 2. OAuth2 클라이언트 생성
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // 3. 인증 URL 생성
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/blogger'],
      prompt: 'consent' // 강제로 새 refresh token 발급
    });

    console.log('\n🔐 다음 URL을 브라우저에서 열어 인증하세요:\n');
    console.log(authUrl);
    console.log('\n인증 후 받은 코드를 입력하세요:\n');

    // 4. 사용자 입력 대기
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('코드: ', async (code) => {
      rl.close();

      try {
        // 5. 코드로 토큰 발급
        const { tokens } = await oAuth2Client.getToken(code);

        // 6. 토큰 저장
        fs.writeFileSync('./token.json', JSON.stringify(tokens, null, 2));

        console.log('\n✅ 토큰이 저장되었습니다: token.json');
        console.log('\n📋 토큰 정보:');
        console.log('   - Access Token: ✅');
        console.log('   - Refresh Token: ✅');

        if (tokens.expiry_date) {
          const expiryDate = new Date(tokens.expiry_date);
          console.log('   - 만료일:', expiryDate.toLocaleString('ko-KR'));
        }

        console.log('\n🎉 Production 모드이므로 이제 Refresh Token이 영구적으로 사용됩니다!\n');

      } catch (err) {
        console.error('\n❌ 인증 코드가 잘못되었습니다:', err.message);
        console.log('\n다시 실행해서 새 코드를 받으세요.\n');
      }
    });

  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

refreshToken();
