import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const base = process.env.ATELIER_URL || 'http://localhost:3101';
mkdirSync('scripts/shots', { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let errors = [];
try {
for (const width of [1440,390]) {
 const context = await browser.newContext({ viewport: {width,height:900} });
 await context.addInitScript(()=>sessionStorage.setItem('dv-intro','1'));
 const page=await context.newPage(); page.setDefaultTimeout(120000);
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400) errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(base, {waitUntil:'networkidle', timeout:120000});
 if(await page.locator('.space-card').count()!==14) throw Error('Missing catalog type');
 await page.getByRole('button',{name:'Industrial',exact:true}).dispatchEvent('click');
 await page.waitForFunction(()=>document.querySelectorAll('.space-card').length===2);
 await page.goto(base+'/builder?type=villa-g2',{waitUntil:'domcontentloaded', timeout:120000});
 await page.locator('.step',{hasText:'Elevation'}).click({force:true});
 await page.getByRole('button',{name:'street',exact:true}).click({force:true});
 await page.getByRole('button',{name:'Golden hour',exact:true}).click({force:true});
 await page.getByLabel('Custom main walls colour').fill('#6d8171');
 await page.waitForTimeout(4000);
 const project=await page.evaluate(()=>JSON.parse(localStorage.getItem('dv-builder-1')));
 if(project.elevation.paint!=='#6d8171'||project.floors.length!==3) throw Error('Preset or paint persistence failed');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('Horizontal overflow');
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:`scripts/shots/atelier-${width}.png`,timeout:90000});
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.step').first().waitFor();
 if(await page.evaluate(()=>JSON.parse(localStorage.getItem('dv-builder-1')).elevation.paint)!=='#6d8171') throw Error('Saved preset paint lost on reload');
 console.log('PASS atelier composition, paint persistence, catalog at '+width);
 await context.close();
}
const page=await browser.newPage();
page.on('pageerror',e=>errors.push(e.message));
for(const type of ['villa-g2','highrise','community','mall','salon','industrial']){
 await page.goto(base+'/studio?type='+type,{waitUntil:'domcontentloaded', timeout:120000});
 await page.waitForTimeout(600);
 if(await page.locator('h1').count()!==1) throw Error('Missing studio '+type);
 console.log('PASS studio '+type);
}
await page.close();
if(errors.length) throw Error([...new Set(errors)].join('\n'));
} finally {await browser.close();}


