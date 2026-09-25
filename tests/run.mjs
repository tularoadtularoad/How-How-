// Запуск сценария в Chrome с WebGL: node tests/run.mjs weapons/ak74_modular.html tests/smoke.mjs
// Сценарий — default async (page, shot, log). CHROME — путь к браузеру (иначе Chromium из Playwright).
// Без видеокарты (CI, контейнер): Xvfb + Mesa llvmpipe, DISPLAY=:99 — это заодно модель очень слабого ПК.
import { chromium } from "playwright-core";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
process.env.DISPLAY ||= ":99";
const [,, file, scen, w = "1280", h = "720"] = process.argv;
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined,
  args: ["--use-gl=angle", "--use-angle=gl", "--no-sandbox", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const logs = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") logs.push(m.type() + ": " + m.text().slice(0, 400)); });
page.on("pageerror", (e) => logs.push("PAGEERROR: " + e.message));
await page.goto(pathToFileURL(resolve(file)).href + (process.env.QS || ""));
await page.waitForFunction(() => window.__app, null, { timeout: 120000 });
const out = new URL("../tests/shots/", import.meta.url).pathname;
await import("node:fs").then((fs) => fs.mkdirSync(out, { recursive: true }));
const shot = (name) => page.screenshot({ path: out + name + ".png" });
const mod = await import(pathToFileURL(resolve(scen)).href + "?" + Date.now());
try { await mod.default(page, shot, console.log); } catch (e) { console.log("SCENARIO ERROR", e.message); }
if (logs.length) console.log("--- console:\n" + [...new Set(logs)].slice(0, 25).join("\n"));
await browser.close();
