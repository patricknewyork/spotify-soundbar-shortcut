# Spotify to Samsung Soundbar: One-Tap iPhone Shortcut

A Scriptable script + iPhone Shortcut that transfers Spotify playback to a Wi-Fi connected Samsung soundbar in one tap. No AirPlay, no manual switching through the Spotify Connect menu.

## Quick Install

- **Shortcut (one-tap):** [Add to Shortcuts](https://www.icloud.com/shortcuts/b36e588aa1f34af7a37bcf3c2bbea37d)
- **Script:** Copy `spotify-soundbar.js` from this repo into Scriptable

Then follow the setup steps below.

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

### Step 4: Install the Shortcut

1. Tap the **Add to Shortcuts** link above
2. In the Shortcut editor, tap "Spotify Soundbar" in blue and select your script name
3. Turn off **Run In App** and **Show When Run**
4. Leave the parameter field empty
5. Add to your home screen

---

## Usage

Tap the shortcut. Spotify transfers to the soundbar and sets your volume automatically.

If the soundbar is off or in deep standby, Spotify's API won't see it. The script will show a clear error listing which devices are currently visible instead of failing silently.

---
## Disclaimer

This project is offered as-is with no warranty, guarantee of functionality, or ongoing support. Use at your own risk.

A few things worth knowing:

- Spotify's Web API terms of service prohibit commercial use. This is for personal use only.
- Your Client ID and Secret give access to your Spotify account. Never share your configured version of this script publicly.
- The Spotify API can change at any time, which may break functionality without notice.
- This project is not affiliated with Spotify, Samsung, or Apple.

## Notes

- Spotify Premium is required for playback transfer via the API
- The device name in the config must match exactly what appears in Spotify Connect
- Keep your Client ID and Secret private. Do not share your configured version of the script publicly.


