// ─── CONFIG ───────────────────────────────────────────
const DEVICE_NAME  = "Samsung Soundbar"; // match exactly what Spotify shows
const CLIENT_ID    = "YOUR_CLIENT_ID";
const CLIENT_SECRET= "YOUR_CLIENT_SECRET";
const REDIRECT_URI = "https://example.com/callback";
const SCOPES       = "user-read-playback-state user-modify-playback-state";
const KEYCHAIN_KEY = "spotify_refresh_token";
const VOLUME       = 4; // percentage, 0-100
// ──────────────────────────────────────────────────────

async function getAccessToken() {
  let refreshToken = Keychain.contains(KEYCHAIN_KEY)
    ? Keychain.get(KEYCHAIN_KEY)
    : null;

  if (!refreshToken) {
    refreshToken = await doInitialAuth();
    if (!refreshToken) throw new Error("Authorization cancelled.");
  }

  const credentials = btoa(CLIENT_ID + ":" + CLIENT_SECRET);
  const req = new Request("https://accounts.spotify.com/api/token");
  req.method = "POST";
  req.headers = {
    "Authorization": "Basic " + credentials,
    "Content-Type": "application/x-www-form-urlencoded"
  };
  req.body = "grant_type=refresh_token&refresh_token="
    + encodeURIComponent(refreshToken);

  const res = await req.loadJSON();
  if (res.error) {
    Keychain.remove(KEYCHAIN_KEY);
    throw new Error("Token refresh failed: " + res.error_description
      + ". Run the script again to re-authorize.");
  }
  if (res.refresh_token) {
    Keychain.set(KEYCHAIN_KEY, res.refresh_token);
  }
  return res.access_token;
}

async function doInitialAuth() {
  const authUrl = "https://accounts.spotify.com/authorize"
    + "?client_id=" + CLIENT_ID
    + "&response_type=code"
    + "&redirect_uri=" + encodeURIComponent(REDIRECT_URI)
    + "&scope=" + encodeURIComponent(SCOPES);

  Safari.open(authUrl);

  const alert = new Alert();
  alert.title = "Paste the redirect URL";
  alert.message = "Spotify opened in Safari. Tap Agree, then copy the full URL "
    + "from the address bar (starts with https://example.com/callback?code=...) "
    + "and paste it below.";
  alert.addTextField("Paste URL here");
  alert.addAction("Continue");
  alert.addCancelAction("Cancel");

  const idx = await alert.presentAlert();
  if (idx === -1) return null;

  const pastedUrl = alert.textFieldValue(0);
  const match = pastedUrl.match(/[?&]code=([^&]+)/);
  if (!match) throw new Error("No authorization code found in URL.");

  const code = match[1];
  const credentials = btoa(CLIENT_ID + ":" + CLIENT_SECRET);
  const req = new Request("https://accounts.spotify.com/api/token");
  req.method = "POST";
  req.headers = {
    "Authorization": "Basic " + credentials,
    "Content-Type": "application/x-www-form-urlencoded"
  };
  req.body = "grant_type=authorization_code"
    + "&code=" + encodeURIComponent(code)
    + "&redirect_uri=" + encodeURIComponent(REDIRECT_URI);

  const res = await req.loadJSON();
  if (res.error) throw new Error("Auth exchange failed: " + res.error_description);

  Keychain.set(KEYCHAIN_KEY, res.refresh_token);
  return res.refresh_token;
}

// ─── MAIN ─────────────────────────────────────────────
try {
  const token = await getAccessToken();

  const devReq = new Request("https://api.spotify.com/v1/me/player/devices");
  devReq.headers = { "Authorization": "Bearer " + token };
  const devData = await devReq.loadJSON();
  const devices = devData.devices || [];

  const soundbar = devices.find(d => d.name === DEVICE_NAME);
  if (!soundbar) {
    const found = devices.map(d => d.name).join(", ") || "none detected";
    throw new Error(
      '"' + DEVICE_NAME + '" not found.\n\n'
      + "Make sure the soundbar is on and Spotify Connect is active.\n\n"
      + "Devices visible: " + found
    );
  }

  const playReq = new Request("https://api.spotify.com/v1/me/player");
  playReq.method = "PUT";
  playReq.headers = {
    "Authorization": "Bearer " + token,
    "Content-Type": "application/json"
  };
  playReq.body = JSON.stringify({ device_ids: [soundbar.id], play: true });
  await playReq.load();

  const volReq = new Request(
    "https://api.spotify.com/v1/me/player/volume?volume_percent=" + VOLUME
  );
  volReq.method = "PUT";
  volReq.headers = { "Authorization": "Bearer " + token };
  await volReq.load();

} catch (e) {
  const alert = new Alert();
  alert.title = "Something went wrong";
  alert.message = e.message;
  alert.addAction("OK");
  await alert.presentAlert();
}

Script.complete();
