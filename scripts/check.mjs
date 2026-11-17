// Browser check for the harness (CLAUDE.md section 5). Run after `npm run build`:
//   npm run check
// Starts the production server, loads every page at desktop and 390px mobile widths, fails on console
// errors or horizontal overflow, and saves screenshots to scripts/shots/ for a visual review.
import { chromium } from "playwright";
import { spawn, execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.CHECK_PORT || 3100);
const BASE = `http://localhost:${PORT}`;
const shots = fileURLToPath(new URL("./shots/", import.meta.url));
mkdirSync(shots, { recursive: true });

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)], { stdio: "inherit" });
const stop = () => {
  if (process.platform === "win32") {
    try {
      execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" });
    } catch {}
  } else server.kill();
};

for (let i = 0; ; i++) {
  try {
    if ((await fetch(BASE)).ok) break;
  } catch {}
  if (i > 60) {
    stop();
    throw new Error("Server did not start");
  }
  await new Promise((r) => setTimeout(r, 500));
}

process.on("exit", stop);
// A failed top-level await surfaces as an unhandled rejection; exit cleanly so the server is stopped.
for (const event of ["uncaughtException", "unhandledRejection"]) {
  process.on(event, (e) => {
    console.error(e);
    process.exit(1);
  });
}

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const viewports = [
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
const pages = [
  { path: "/", name: "home", full: true },
  { path: "/studio?type=2bhk", name: "studio-2bhk" },
  { path: "/studio?type=3bhk", name: "studio-3bhk" },
  { path: "/studio?type=villa", name: "studio-villa" },
  { path: "/studio?type=office", name: "studio-office" },
  { path: "/studio?type=retail", name: "studio-retail" },
  { path: "/studio?type=pooja", name: "studio-pooja" },
];

let failures = 0;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(context, path) {
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 120000 });
  return { page, errors };
}

function report(label, errors, overflow) {
  const ok = errors.length === 0 && overflow <= 0;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${overflow > 0 ? `  overflow ${overflow}px` : ""}`);
  for (const e of errors) console.log(`      console: ${e.slice(0, 300)}`);
}

// The body clips horizontal overflow, so scrollWidth alone would hide cut-off content.
// Also flag visible text and controls that cross the viewport edge, outside sideways-scrolling strips.
const overflowOf = (page) =>
  page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    let worst = document.documentElement.scrollWidth - vw;
    for (const el of document.querySelectorAll("h1, h2, h3, p, a, button, li, label, input, select, textarea")) {
      if (el.closest("[aria-hidden=true], .chips, .studio-tabs, .lightbox")) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      worst = Math.max(worst, Math.round(r.right - vw), Math.round(-r.left));
    }
    return worst;
  });

// The temple-door intro: closed, then mid-swing.
{
  const context = await browser.newContext(viewports[0]);
  const { page, errors } = await open(context, "/");
  await wait(1300);
  await page.screenshot({ path: `${shots}desktop-intro.png` });
  await wait(1900);
  await page.screenshot({ path: `${shots}desktop-intro-opening.png` });
  report("desktop intro", errors, 0);
  await context.close();
}

for (const vp of viewports) {
  const context = await browser.newContext(vp);
  await context.addInitScript(() => sessionStorage.setItem("dv-intro", "1"));
  for (const p of pages) {
    const { page, errors } = await open(context, p.path);
    if (p.full) {
      // One viewport screenshot per section. Full-page captures of a 12k px page break the software renderer.
      await wait(1500);
      await page.screenshot({ path: `${shots}${vp.name}-home-00-hero.png` });
      const sections = [".divine-foundation", "#about", "#services", "#projects", "#spaces", ".mood-section", "#work", "#process", ".vision", "#contact", ".footer"];
      for (const [i, sel] of sections.entries()) {
        await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: "start" }), sel);
        await wait(1600);
        await page.screenshot({ path: `${shots}${vp.name}-home-${String(i + 1).padStart(2, "0")}-${sel.replace(/[#.]/g, "")}.png` });
      }
    } else {
      await wait(5000);
      await page.screenshot({ path: `${shots}${vp.name}-${p.name}.png` });
    }
    report(`${vp.name} ${p.name}`, errors, await overflowOf(page));
    await page.close();
  }

  // Studio interactions: choose a room on the blueprint, make it premium, switch to dusk.
  {
    const { page, errors } = await open(context, "/studio?type=3bhk");
    await wait(4000);
    if (vp.isMobile) await page.getByRole("tab", { name: "Blueprint" }).click();
    await page.locator(".bp-room").nth(7).click();
    await page.locator(".tier-pick button", { hasText: "Premium" }).click();
    if (vp.isMobile) await page.getByRole("tab", { name: "3D view" }).click();
    await page.getByRole("button", { name: /Dusk/ }).click();
    await wait(4000);
    await page.screenshot({ path: `${shots}${vp.name}-studio-3bhk-master-premium-dusk.png`, fullPage: vp.isMobile });
    const tag = await page.locator(".inspector h2").textContent();
    if (tag !== "Master bedroom") errors.push(`Inspector shows "${tag}" instead of the master bedroom`);
    report(`${vp.name} studio interactions`, errors, await overflowOf(page));
    await page.close();
  }

  // Builder: start from a preset, recolour a room, pick an elevation, then play the construction timeline.
  {
    const { page, errors } = await open(context, "/builder");
    await wait(1500);
    await page.screenshot({ path: `${shots}${vp.name}-builder-1-plot.png` });
    await page.locator(".start-list button", { hasText: "2 BHK" }).click();
    await wait(800);
    if (vp.isMobile) await page.getByRole("tab", { name: "Blueprint" }).click();
    await page.locator(".pe-room .pe-fill").nth(6).click();
    await page.locator(".colour").first().getByRole("button", { name: "Peacock" }).click();
    await wait(4000);
    await page.screenshot({ path: `${shots}${vp.name}-builder-2-plan.png` });
    if (vp.isMobile) {
      await page.getByRole("tab", { name: "3D view" }).click();
      await wait(3500);
      await page.screenshot({ path: `${shots}${vp.name}-builder-2b-plan-3d.png` });
    }
    // With the full exterior on screen, software rendering is too slow for Playwright's "stable" wait,
    // so these clicks skip it (force) and screenshots get extra time. Real devices render on the GPU.
    await page.locator(".step", { hasText: "Elevation" }).click({ force: true });
    await page.locator(".style-pick button", { hasText: "South Indian" }).click({ force: true });
    await wait(5000);
    await page.screenshot({ path: `${shots}${vp.name}-builder-3-elevation.png`, timeout: 90000 });
    await page.locator(".step", { hasText: "Build" }).click({ force: true });
    await wait(4500);
    await page.screenshot({ path: `${shots}${vp.name}-builder-4-building.png`, timeout: 90000 });
    await wait(9000);
    await page.screenshot({ path: `${shots}${vp.name}-builder-5-built-dusk.png`, timeout: 90000 });
    report(`${vp.name} builder`, errors, await overflowOf(page));
    await page.close();
  }
  await context.close();
}

await browser.close();
stop();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);



