// Warms Vercel's image cache after a deploy. Run from India (where most visitors are), since Vercel caches per region:
//   npm run warm                      (production)
//   npm run warm -- https://preview-url/
// Loads the home page on common phone and desktop screens and scrolls through every section, so it requests
// exactly the image sizes real browsers ask for. The first visitor after a deploy then gets cached images
// instead of waiting while Vercel resizes them.
import { chromium } from "playwright";

const url = process.argv[2] || "https://vdv-zeta.vercel.app/";
const screens = [
  { name: "phone 390 @3x", viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  { name: "phone 412 @2.6x", viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true },
  { name: "laptop 1366 @1x", viewport: { width: 1366, height: 768 } },
  { name: "desktop 1440 @2x", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  { name: "desktop 1920 @1x", viewport: { width: 1920, height: 1080 } },
];
const sections = [".showcase", ".divine-foundation", "#about", "#services", "#projects", "#spaces", ".mood-section", "#work", "#process", ".vision", "#contact", ".footer"];

const browser = await chromium.launch();
let cold = 0, warm = 0;
for (const screen of screens) {
  const context = await browser.newContext(screen);
  // Skip the intro so the page can scroll; its images still load because the dialog is in the page.
  await context.addInitScript(() => sessionStorage.setItem("dv-intro", "1"));
  const page = await context.newPage();
  const seen = new Map();
  page.on("response", (r) => {
    if (r.request().resourceType() !== "image" || !r.url().includes("/_next/image")) return;
    seen.set(r.url(), r.headers()["x-vercel-cache"] || "?");
  });
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  for (const sel of sections) {
    await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: "start" }), sel);
    await page.waitForTimeout(700);
  }
  await page.waitForLoadState("networkidle");
  const misses = [...seen.values()].filter((v) => v !== "HIT").length;
  cold += misses;
  warm += seen.size - misses;
  console.log(`${screen.name.padEnd(18)} ${seen.size} images, ${misses} were not cached yet`);
  await context.close();
}
await browser.close();
console.log(`\nDone: ${cold} image sizes warmed, ${warm} were already cached.`);
