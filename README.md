# Jetlag Compass · 倒时差罗盘 ✦

A **science-based jet-lag planner**. Tell it where you're flying and your sleep habits; it gives you a day-by-day schedule of **when to sleep** and **when to seek or avoid bright light** to reset your body clock as fast as the science allows. Runs entirely in your browser.

> 一个**基于昼夜节律科学**的倒时差规划器。告诉它你从哪飞到哪、平时几点睡,它给你一份逐日计划:**几点睡、何时晒亮光、何时保持昏暗**,用科学允许的最快速度重置生物钟。纯浏览器运行,数据不出本地。

![no dependencies](https://img.shields.io/badge/dependencies-0-2f8a66) ![tests](https://img.shields.io/badge/tests-node%3Atest-3a7fc0) ![license](https://img.shields.io/badge/license-MIT-e08a44)

> ⚕️ **Educational planning aid based on general circadian-rhythm science — not medical advice.** If you take medication or have a health condition, talk to a healthcare professional.

## Why this one is different

Most jet-lag tools just say "adjust gradually." This one applies the actual mechanism your body uses — the **light Phase Response Curve (PRC)**:

- Light **after** your core-body-temperature minimum (≈2 h before your usual wake time) **advances** the clock (shifts you earlier).
- Light **before** it **delays** the clock (shifts you later).

So the app figures out which direction you need to shift, and tells you exactly when to **chase light** and when to **stay dim** — the single most powerful lever for re-entrainment.

## What it does

- **Direction & size of the shift** — east (advance) vs. west (delay), and how many hours.
- **Smart "flip" for hard trips** — for big eastward jumps (>9 h), it recommends *delaying the long way around*, which is usually easier on the body.
- **Day-by-day schedule** in destination local time — target sleep/wake plus **get-bright-light** and **keep-it-dim** windows, converging to your normal routine.
- **Pre-flight prep** — optionally start shifting a few days early so you land partly adjusted.
- **Bilingual** (English / 中文), 22 common cities, **zero dependencies**, 100% client-side.

## Try it

- **Locally:** open `index.html`. No build, no server.
- **Hosted:** enable GitHub Pages → `https://<you>.github.io/jetlag-compass/`.

## Trust the math

The engine (`assets/jetlag.js`) is a pure, framework-free module with unit tests covering shift normalization, direction logic, the eastward "flip", days-to-adjust, and that the schedule converges to your home routine.

```bash
node --test        # runs test/jetlag.test.js (Node 18+, no dependencies)
```

## How it works

1. **Shift** = destination UTC offset − home UTC offset, normalized to (−12, +12]. Positive ⇒ destination ahead ⇒ advance; negative ⇒ behind ⇒ delay.
2. **Rate**: the clock moves ~1 h/day advancing, ~1.5 h/day delaying — so `days ≈ shift ÷ rate`.
3. **Light windows** are placed relative to your shifting sleep schedule per the PRC (morning light to advance, evening light to delay; opposite times kept dim).
4. Times are shown in **destination local time** so you can act on them directly.

It deliberately keeps things behavioral (light + sleep timing). Melatonin is mentioned only as cautious, optional information.

## Project structure

```
jetlag-compass/
├── index.html
├── assets/
│   ├── jetlag.js     # pure circadian engine (browser + Node)
│   ├── app.js        # UI, i18n, rendering
│   └── style.css
└── test/jetlag.test.js
```

## License

[MIT](LICENSE). Not medical advice.
