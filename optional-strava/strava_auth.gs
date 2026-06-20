/**
 * Running AI Karte - Optional Strava OAuth
 */

function createStravaAuthUrl() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setupSheet = ss.getSheetByName('Strava_Setup');
  if (!setupSheet) throw new Error('Strava_Setup sheet is missing. Run showStravaSetup(). / Strava_Setupシートがありません。showStravaSetup() を実行してください。');

  const settings = getStravaSetupValues_(setupSheet);
  const clientId = settings.STRAVA_CLIENT_ID;
  if (!clientId) {
    safeUiAlert_('Enter STRAVA_CLIENT_ID in Strava_Setup first.\n\n先にStrava_SetupへSTRAVA_CLIENT_IDを入力してください。');
    return;
  }

  const redirectUri = 'http://localhost';
  const scope = 'read,activity:read_all';
  const url = 'https://www.strava.com/oauth/authorize'
    + '?client_id=' + encodeURIComponent(clientId)
    + '&response_type=code'
    + '&redirect_uri=' + encodeURIComponent(redirectUri)
    + '&approval_prompt=force'
    + '&scope=' + encodeURIComponent(scope);

  setStravaSetupValue_(setupSheet, 'STRAVA_AUTH_URL', url);
  safeUiAlert_('Strava auth URL created. Open STRAVA_AUTH_URL, authorize, then paste the callback URL or code into STRAVA_CALLBACK_URL_OR_CODE.\n\nStrava認証URLを作成しました。STRAVA_AUTH_URLを開いて許可し、表示されたURL全体またはcodeをSTRAVA_CALLBACK_URL_OR_CODEへ貼り付けてください。');
}

function exchangeStravaAuthorizationCodeFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setupSheet = ss.getSheetByName('Strava_Setup');
  if (!setupSheet) throw new Error('Strava_Setup sheet is missing. Run showStravaSetup(). / Strava_Setupシートがありません。showStravaSetup() を実行してください。');

  const settings = getStravaSetupValues_(setupSheet);
  const clientId = settings.STRAVA_CLIENT_ID;
  const clientSecret = settings.STRAVA_CLIENT_SECRET;
  const code = extractStravaCode_(settings.STRAVA_CALLBACK_URL_OR_CODE);

  if (!clientId || !clientSecret || !code) {
    safeUiAlert_('Enter STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_CALLBACK_URL_OR_CODE first.\n\n先にSTRAVA_CLIENT_ID、STRAVA_CLIENT_SECRET、STRAVA_CALLBACK_URL_OR_CODEを入力してください。');
    return;
  }

  const response = UrlFetchApp.fetch('https://www.strava.com/oauth/token', {
    method: 'post',
    payload: {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code'
    },
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const body = response.getContentText();
  if (status < 200 || status >= 300) throw new Error('Strava token exchange failed / Stravaトークン交換に失敗しました: ' + status + ' ' + body);

  const data = JSON.parse(body);
  if (!data.refresh_token) throw new Error('No refresh_token returned / refresh_tokenが返りませんでした: ' + body);

  PropertiesService.getScriptProperties().setProperties({
    STRAVA_CLIENT_ID: clientId,
    STRAVA_CLIENT_SECRET: clientSecret,
    STRAVA_REFRESH_TOKEN: data.refresh_token
  });

  setStravaSetupValue_(setupSheet, 'STRAVA_REFRESH_TOKEN', 'saved');
  setStravaSetupValue_(setupSheet, 'STRAVA_SCOPE', data.scope || '');
  setStravaSetupValue_(setupSheet, 'STRAVA_CLIENT_SECRET', '');
  setStravaSetupValue_(setupSheet, 'STRAVA_CALLBACK_URL_OR_CODE', '');
  safeUiAlert_('Strava connection completed. Client secret and refresh token are stored in Script Properties.\n\nStrava連携が完了しました。Client SecretとRefresh TokenはScript Propertiesへ保存されました。');
}

function getStravaAccessToken_() {
  const props = PropertiesService.getScriptProperties();
  const clientId = props.getProperty('STRAVA_CLIENT_ID');
  const clientSecret = props.getProperty('STRAVA_CLIENT_SECRET');
  const refreshToken = props.getProperty('STRAVA_REFRESH_TOKEN');
  if (!clientId || !clientSecret || !refreshToken) throw new Error('Strava credentials are missing. / Strava認証情報が不足しています。');

  const response = UrlFetchApp.fetch('https://www.strava.com/oauth/token', {
    method: 'post',
    payload: {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    },
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const body = response.getContentText();
  if (status < 200 || status >= 300) throw new Error('Strava token refresh failed / Stravaトークン更新に失敗しました: ' + status + ' ' + body);

  const data = JSON.parse(body);
  if (data.refresh_token) props.setProperty('STRAVA_REFRESH_TOKEN', data.refresh_token);
  return data.access_token;
}

function extractStravaCode_(callbackOrCode) {
  if (!callbackOrCode) return '';
  const s = String(callbackOrCode).trim();
  const m = s.match(/[?&]code=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : s;
}
