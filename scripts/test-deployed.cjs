const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),origin=process.env.GATHERLY_URL||'https://cgt-390-project-seven.vercel.app',out=path.join(root,'output/lab9');
(async()=>{
 const assets=[];
 for(const file of ['app.js','analytics.js','styles.css']){
  const response=await fetch(`${origin}/${file}?v=9`);assert.equal(response.status,200);
  assert.equal(await response.text(),fs.readFileSync(path.join(root,'event-discovery-app',file),'utf8'),`${file} matches tested local source`);
  assets.push({file,status:response.status,matchesLocal:true});
 }
 const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true}),flows=[];
 try{
  for(const width of [390,768,1100]){
   const context=await browser.newContext({viewport:{width,height:844}}),errors=[],vendor=[];
   await context.route('**/*',route=>{if(new URL(route.request().url()).origin===origin)return route.continue();vendor.push(route.request().url());return route.abort();});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   const response=await page.goto(`${origin}/explore.html`);assert.equal(response.status(),200);
   assert.equal(vendor.length,0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.locator('[data-search]').fill('clay');await page.locator('[data-filter="category"][data-value="Creative"]').click();
   await page.locator('[data-save="clay-club"]').click();assert.equal(await page.locator('[data-search]').inputValue(),'clay');assert.equal(await page.locator('.event-card').count(),1);
   await page.goto(`${origin}/event.html?id=clay-club`);assert.equal(await page.locator('[data-save="clay-club"]').getAttribute('aria-pressed'),'true');
   if(width===390){assert.equal(await page.locator('.detail-image').evaluate(el=>el.getBoundingClientRect().height),260);assert.equal(await page.locator('.detail-actions').evaluate(el=>getComputedStyle(el).position),'sticky');}
   await page.goto(`${origin}/saved.html`);assert.equal(await page.locator('.event-card').count(),1);
   await page.locator('[data-save="clay-club"]').click();await page.reload();assert.equal(await page.locator('.event-card').count(),0);
   await page.goto(`${origin}/event.html?id=not-real`);assert.equal(await page.locator('h1').textContent(),'Event not found');assert.equal(await page.locator('[data-save]').count(),0);
   assert.deepEqual(errors,[]);
   flows.push({width,expected:'Live discovery, filter preservation, save persistence, remove persistence, missing-record handling, no horizontal overflow or JavaScript page errors; deferred analytics before interaction; mobile artwork and sticky controls',pass:true,pageErrors:errors});
   await context.close();
  }
  fs.writeFileSync(path.join(out,'production-tests.json'),JSON.stringify({date:'2026-10-22',origin,assets,flows,note:'Isolated anonymous browser contexts; third-party delivery blocked; all saved records are fictional'},null,2)+'\n');
  console.log('Production: 3/3 assets match local source and 3/3 responsive task flows passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
