# App Store Screenshots Guide — Inkly: Daily Vibes

## Status
- [x] Benefits confirmed (5 screenshots)
- [ ] Simulator screenshots captured
- [ ] Screenshots paired with benefits
- [ ] Final screenshots generated

---

## When you're ready, tell Claude:
> "I have my simulator screenshots, let's continue the App Store screenshots"

Claude will pick up from where we left off — benefits are already saved in memory.

---

## 5 Confirmed Benefits

| # | Headline | Hook |
|---|---|---|
| 1 | **YOUR PHOTO TELLS YOUR STORY** | Point at anything — AI reads the moment + your vibe and writes the quote |
| 2 | **NO TWO QUOTES ARE EVER THE SAME** | Same sunset, different person = totally different quote — it's literally yours |
| 3 | **MAKE ANY MOMENT DROP-WORTHY** | Coffee, fits, sunsets — AI turns your everyday shots into aesthetic quote cards |
| 4 | **FLIP THE VIBE IN ONE TAP** | Not feeling it? Go Funny, Savage, or Calm — same photo, whole new energy |
| 5 | **YOUR CREW'S MOMENTS, YOUR FEED** | See what your friends' photos made the AI say — don't miss out |

---

## Simulator Screenshots to Capture

### Before capturing any screenshot
1. Open iOS Simulator
2. Go to **Simulator → Features → Status Bar**
   - Time: **9:41**
   - Battery: **100%, charging**
   - Signal: **Full bars**
3. Use **iPhone 15 Pro** simulator (or any 6.7" model)
4. Pick **one mode** (light or dark) and keep it consistent across all 5

---

### Screenshot 1 — YOUR PHOTO TELLS YOUR STORY
**Screen:** Home screen with a freshly generated quote card

What it must show:
- A real photo in the background (not blank/placeholder) — something everyday like coffee, a view, food, a fit
- A generated quote overlaid on top
- The colorful gradient background visible
- The quote text readable and compelling

**Avoid:** Empty camera state, loading spinner, placeholder text

---

### Screenshot 2 — NO TWO QUOTES ARE EVER THE SAME
**Screen:** Persona / personality traits selection screen

What it must show:
- At least **4-5 traits already selected** and highlighted (e.g., creative, humorous, curious, bold, energetic)
- The selection UI looking active and colorful — not empty

**Avoid:** No traits selected, grey/empty state

---

### Screenshot 3 — MAKE ANY MOMENT DROP-WORTHY
**Screen:** Quote card on the most vibrant/colorful gradient background available

What it must show:
- The **most colorful gradient theme** you have (Aurora, Prism, or Coral work great)
- A real photo with a great quote on top
- Font and color styling visible (shows customization)

**Avoid:** Default/plain background, blank photo

---

### Screenshot 4 — FLIP THE VIBE IN ONE TAP
**Screen:** Rewrite modal / AI tools panel open

What it must show:
- The **3 tone options clearly visible: Calm, Funny, Savage**
- The current quote shown above the options
- The modal in an open/active state

**Avoid:** Collapsed modal, loading state

---

### Screenshot 5 — YOUR CREW'S MOMENTS, YOUR FEED
**Screen:** Friends feed

What it must show:
- **At least 2-3 friend quote cards** visible, each with a different photo and quote
- Real-looking display names (not "Test User" or blank)
- Reactions or engagement visible if possible

**Avoid:** Empty feed ("No friends yet"), single card only

---

## Where to save your screenshots

Save all 5 to:
```
docs/simulator-screenshots/
  01-photo-tells-story.png
  02-no-two-quotes.png
  03-drop-worthy.png
  04-flip-the-vibe.png
  05-crew-feed.png
```

Then tell Claude the path and generation starts immediately.

---

## What gets generated

Each simulator screenshot becomes a polished App Store marketing image:
- **Dimensions:** 1290 × 2796px (iPhone 6.7" — required by App Store Connect)
- **Style:** Bold colorful background + large headline text + iPhone device frame with your screenshot inside
- **Output:** `screenshots/final/` folder — ready to upload directly to App Store Connect

---

## Dependencies (already set up)
- [x] `@houtini/gemini-mcp` installed and configured in `~/.claude/settings.json`
- [x] Gemini API key set
- [x] `~/.claude/skills/aso-appstore-screenshots/` skill installed
- [ ] SF Pro Display Black font — download from https://developer.apple.com/fonts/ and install to `/Library/Fonts/SF-Pro-Display-Black.otf`
