// Screenshot a page at several sizes and themes, scrolling through it.
// Usage: node --experimental-websocket shoot.mjs <url> <outDir> [--sizes 1440x900,390x844m] [--themes light,dark|none]
//        [--theme-key theme] [--wait 10000] [--top-only]
// A size ending in "m" is emulated as a phone. Needs Node 20+ and google-chrome (or set CHROME=/path).
import { spawn } from "node:child_process";
import fs from "node:fs";

const [url, out = "./shots", ...rest] = process.argv.slice(2);
if (!url) { console.error("usage: shoot.mjs <url> <outDir> [options]"); process.exit(1); }
const opt = (name, def) => { const i = rest.indexOf("--" + name); return i < 0 ? def : rest[i + 1]; };
const sizes = opt("sizes", "1920x1080,1440x900,1366x768,1024x768,390x844m").split(",").map((s) => {
  const m = s.match(/^(\d+)x(\d+)(m?)$/); return { w: +m[1], h: +m[2], mobile: !!m[3] };
});
const themes = opt("themes", "light,dark").split(",");
const themeKey = opt("theme-key", "theme");
const wait = +opt("wait", "10000");
const topOnly = rest.includes("--top-only");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(out, { recursive: true });

const profile = fs.mkdtempSync(out + "/.profile-");
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(process.env.CHROME || "google-chrome",
  ["--headless=new", "--no-first-run", "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, "about:blank"],
  { stdio: "ignore" });

let tabs;
for (let i = 0; i < 60; i++) {
  try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (tabs.find((t) => t.type === "page")) break; } catch {}
  await sleep(200);
}
const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = {}; let errors = [];
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (e) => {
  const d = JSON.parse(e.data);
  if (d.id) pending[d.id]?.(d.result ?? d.error);
  else if (d.method === "Runtime.exceptionThrown") errors.push("exception: " + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 200));
  else if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") errors.push("console.error: " + d.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
};
await send("Page.enable"); await send("Runtime.enable");
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }))?.result?.value;
const shot = async (name) => { const s = await send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(s.data, "base64")); };

for (const theme of themes) {
  if (theme !== "none") await send("Page.addScriptToEvaluateOnNewDocument", { source: `try{localStorage.setItem(${JSON.stringify(themeKey)},${JSON.stringify(theme)})}catch{}` });
  for (const { w, h, mobile } of sizes) {
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
    errors = [];
    await send("Page.navigate", { url });
    await sleep(wait);
    const tag = `${theme}-${w}`;
    let n = 0;
    if (topOnly) await shot(`${tag}-0`), n++;
    else {
      const total = await evaluate("document.documentElement.scrollHeight");
      for (let y = 0; y < total && n < 40; y += h * 0.95) {
        await evaluate(`window.scrollTo(0, ${Math.round(y)})`);
        await sleep(1300);
        await shot(`${tag}-${n++}`);
      }
    }
    const overflow = await evaluate("document.documentElement.scrollWidth - innerWidth");
    console.log(`${tag}: ${n} shots, horizontal overflow ${overflow}px, ${errors.length} errors${errors.length ? "\n  " + errors.join("\n  ") : ""}`);
  }
}
ws.close(); chrome.kill(); await sleep(400);
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);
