# Screentime to Cash

Interactive demo of the Screentime to Cash enrollment flow. It runs in the browser as a phone-sized screen: confirm age, pick a birthday, and move through the selected, final-steps, and waiting screens.

The birthday stays on the page. It is only used to check that the date is at least 13 years ago. Nothing is saved on a server.

## Run locally

```bash
npm install
npm run dev
```

The dev server listens on port **42873**.

```bash
npm run build
npm run preview
```

## Flow

1. **Confirm your age** — Confirm continues to the birthday picker. Ask Me Later opens the waiting screen. Learn More explains that the date stays on the page.
2. **Birthday** — Scroll, drag, or use the arrow keys on the month, day, and year wheels. You can also tap the date field to type a date. Under 13 uses one of three tries. A valid age opens the selected screen.
3. **Selected** — Start Now opens the final steps. Ask Me Later returns to waiting.
4. **Final steps** — I'm Ready opens the partner offer and keeps incoming campaign parameters (`s1`, UTM tags, and click ids).
5. **Waiting** — A sample notification appears after a short delay. Tapping it opens the selected screen.

Set `window.TTQ_PIXEL_ID` before `tracking.js` loads if you want the TikTok pixel to send events. Without that id, the page only keeps a local `ttq` stub.
