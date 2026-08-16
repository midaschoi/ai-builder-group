/* Supabase 접속 정보가 없을 때 관리자 화면 대신 나오는 안내.

   공개 웹은 값이 없어도 그대로 동작해야 하므로(.env.example 의 약속) 여기서 죽이지 않고
   무엇을 채워야 하는지 알려준다. */
export default function SetupNotice() {
  return (
    <div className="adm">
      <div className="adm-setup">
        <h1>관리자를 쓰려면 Supabase 연결이 먼저입니다</h1>
        <p>
          공개 웹은 이 설정 없이도 정상 동작합니다. 관리자 화면만 아직 열 수 없습니다.
        </p>
        <ol>
          <li>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
              supabase.com
            </a>
            에서 프로젝트를 만듭니다.
          </li>
          <li>
            <b>SQL Editor</b> 에 저장소의 <code>supabase/migrations/0001_init.sql</code> 을
            통째로 붙여넣고 실행합니다. 테이블 6개와 RLS 정책이 한 번에 만들어집니다.
          </li>
          <li>
            <b>Project Settings → API</b> 에서 값을 복사해
            <code>05-서비스-nextjs/.env.local</code> 에 채웁니다.
            <br />
            <code>SUPABASE_URL</code> · <code>SUPABASE_ANON_KEY</code> ·{' '}
            <code>SUPABASE_SERVICE_ROLE_KEY</code>
          </li>
          <li>
            <code>0001_init.sql</code> 맨 아래 <b>§11</b> 의 안내대로 첫 관리자 계정을 만듭니다.
            자체 회원가입이 없으므로 이 한 번은 손으로 해야 합니다.
          </li>
          <li>개발 서버를 다시 시작합니다. <code>npm run dev</code></li>
        </ol>
      </div>
    </div>
  )
}
