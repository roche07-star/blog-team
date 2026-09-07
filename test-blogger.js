import { authorize, getBlogId } from './blogger-auth.js';

async function testAuth() {
  try {
    console.log('🔐 Blogger API 인증 테스트\n');

    const auth = await authorize();
    console.log('✅ 인증 성공!\n');

    const blogUrl = 'https://ai-toolkit-blog.blogspot.com/';
    const blogId = await getBlogId(auth, blogUrl);

    console.log('✅ Blog ID:', blogId);
    console.log('✅ 자동화 준비 완료!\n');

  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

testAuth();
