async function test() {
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: 'admin', password: 'Admin@123456' })
  });
  const loginData = await loginRes.json();
  console.log('Login response:', JSON.stringify(loginData, null, 2));
  const token = loginData.data?.tokens?.accessToken || loginData.data?.accessToken || loginData.token;

  const appRes = await fetch('http://localhost:5000/api/v1/settings/appearance', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const appData = await appRes.json();
  console.log('Appearance theme:', appData.data?.activeTheme);
  console.log('Radius global:', appData.data?.radiusGlobal);
  console.log('Soft UI distance:', appData.data?.softUiDistance);
  console.log('Soft UI Light BG:', appData.data?.softUiLightBg);
  console.log('Soft UI Dark BG:', appData.data?.softUiDarkBg);

  const resetRes = await fetch('http://localhost:5000/api/v1/settings/appearance/reset-soft-ui', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const resetData = await resetRes.json();
  console.log('Reset Soft UI status:', resetData.status, 'Distance:', resetData.data?.softUiDistance);
}

test().catch(console.error);
