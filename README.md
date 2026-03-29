# Spotify → Samsung Soundbar: One-Tap iPhone Shortcut

A Scriptable script + iPhone Shortcut that transfers Spotify playback to a Wi-Fi connected Samsung soundbar in one tap. No AirPlay, no manual switching through the Spotify Connect menu.

## How it works

Spotify's native Shortcuts actions don't support device switching. This script calls the Spotify Web API directly to find your soundbar by name and transfer playback to it, then sets your preferred volume. Scriptable runs the script silently in the background; a Shortcut on your home screen triggers it.

## Requirements

- iPhone with [Scriptable](https://apps.apple.com/us/app/scriptable/id1405459188) (free)
- Spotify Premium account
- A free [Spotify Developer](https://developer.spotify.com) account
- Samsung soundbar connected to Wi-Fi with Spotify Connect active

---

## Setup

### Step 1: Create a Spotify Developer app

1. Log in at [developer.spotify.com](https://developer.spotify.com) → Create App
2. Any name and description is fine
3. Under **Redirect URIs**, add exactly: `https://example.com/callback`
4. Save, then copy your **Client ID** and **Client Secret**

---

### Step 2: Configure and install the script

1. Open Scriptable, tap **+** in the top right
2. Paste the contents of `spotify-soundbar.js`
3. Edit the config block at the top:
```javascript
const DEVICE_NAME  = "Samsung Soundbar"; // exact name shown in Spotify Connect
const CLIENT_ID    = "YOUR_CLIENT_ID";
const CLIENT_SECRET= "YOUR_CLIENT_SECRET";
const VOLUME       = 4; // percentage, 0-100
```

4. Name the script `Spotify Soundbar` and save

---

### Step 3: Authorize (one-time only)

1. Tap the play button in Scriptable. Safari opens to Spotify's auth screen. Tap Agree.
2. Safari redirects to a "page not found" page on example.com. That's expected.
3. Copy the full URL from Safari's address bar.
4. Switch back to Scriptable, paste the URL into the prompt, tap Continue.

Your refresh token is saved to Scriptable's Keychain. This step never repeats.

---

### Step 4: Create the Shortcut

1. Open the Shortcuts app, tap **+**
2. Search for "Scriptable", add **Run Script**
3. Select `Spotify Soundbar`
4. Turn off **Run In App** and **Show When Run**
5. Leave the parameter field empty
6. Name it and add to your home screen

---

## Usage

Tap the shortcut. Spotify transfers to the soundbar and sets your volume automatically.

If the soundbar is off or in deep standby, Spotify's API won't see it. The script will show a clear error listing which devices are currently visible instead of failing silently.

---

## Notes

- Spotify Premium is required for playback transfer via the API
- The device name in the config must match exactly what appears in Spotify Connect
- Client ID and Secret are stored directly in the script. Keep this repo private.
