const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'event-discovery-app'),out=path.join(root,'output/lab9');
const server=http.createServer((req,res)=>{const file=path.resolve(folder,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(folder+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});});
(async()=>{
 await new Promise(r=>server.listen(4188,'127.0.0.1',r));
 const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true});
 const results=[];
 try{
 for(const width of [390,768,1100]){
  const context=await browser.newContext({viewport:{width,height:844}}); const vendor=[],errors=[];
  await context.route('**/*',route=>{if(new URL(route.request().url()).hostname==='127.0.0.1')return route.continue();vendor.push(route.request().url());return route.abort();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4188/explore.html');
  assert.equal(vendor.length,0,'no third-party download before interaction');
  const header=await page.evaluate(()=>({brand:document.querySelector('.brand').getBoundingClientRect().toJSON(),nav:document.querySelector('.main-nav').getBoundingClientRect().toJSON(),width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert(header.scrollWidth<=width,'no horizontal overflow');
  if(width===390)assert(header.nav.top>=header.brand.bottom,'mobile navigation is on its own row');
  await page.locator('[data-search]').fill('clay'); await page.locator('[data-filter="category"][data-value="Creative"]').click();
  await page.locator('[data-save="clay-club"]').click();
  assert.equal(await page.locator('[data-search]').inputValue(),'clay');assert.equal(await page.locator('.event-card').count(),1);
  assert.equal(await page.locator('[data-filter="category"][data-value="Creative"]').getAttribute('aria-pressed'),'true');
  await page.screenshot({path:path.join(out,`explore-${width}.png`),fullPage:true});
  await page.goto('http://127.0.0.1:4188/event.html?id=clay-club');
  const imageHeight=await page.locator('.detail-image').evaluate(el=>el.getBoundingClientRect().height);
  if(width===390)assert.equal(imageHeight,260);
  await page.evaluate(()=>window.scrollTo(0,document.querySelector('.detail-copy').getBoundingClientRect().top+scrollY-30));
  const action=await page.locator('.detail-actions').evaluate(el=>({position:getComputedStyle(el).position,...el.getBoundingClientRect().toJSON()}));
  if(width===390){assert.equal(action.position,'sticky');assert(action.y>=0&&action.bottom<=844,'mobile action visible while reading detail');}
  assert.equal(await page.locator('[data-save="clay-club"]').getAttribute('aria-pressed'),'true');
  await page.screenshot({path:path.join(out,`detail-${width}.png`),fullPage:width!==390});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.goto('http://127.0.0.1:4188/saved.html');assert.equal(await page.locator('.event-card').count(),1);
  await page.locator('[data-save="clay-club"]').click();await page.reload();assert.equal(await page.locator('.event-card').count(),0);
  await page.goto('http://127.0.0.1:4188/index.html');assert.equal(await page.locator('[data-featured-events] .event-card').count(),3);
  assert.deepEqual(errors,[]);
  results.push({test:`Responsive flow ${width}px`,expected:'No overflow; clay search and Creative filter retained after save; saved state persists; remove persists; home renders; no JavaScript page errors; mobile header, image and sticky action match documented behavior',actual:{header,imageHeight,action,pageErrors:errors},pass:true});
  await context.close();
 }
 for(const route of ['index.html','explore.html','event.html?id=clay-club','saved.html']){
  for(const mode of ['pointer','keyboard']){
   const context=await browser.newContext(),requests=[];await context.route('**/*',r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();requests.push(r.request().url());return r.abort();});
   const page=await context.newPage();await page.goto('http://127.0.0.1:4188/'+route);await page.waitForLoadState('networkidle');
   assert.equal(requests.length,0);assert.equal(await page.evaluate(()=>typeof window.gtag),'function');
   if(mode==='pointer')await page.locator('h1').dispatchEvent('pointerdown');else await page.keyboard.press('Tab');
   await page.waitForFunction(()=>document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').length===1);
   await page.keyboard.press('Tab');await page.locator('h1').dispatchEvent('pointerdown');
   assert.equal(await page.locator('script[src*="googletagmanager.com/gtag/js"]').count(),1);
   if(route.startsWith('event')){await page.locator('[data-save="clay-club"]').click();assert.equal(await page.evaluate(()=>window.dataLayer.some(args=>args[0]==='event'&&args[1]==='event_saved'&&args[2].event_id==='clay-club')),true);}
   results.push({test:`Deferred analytics ${route} ${mode}`,expected:'No vendor script before interaction; exactly one loader after first interaction; local event queue remains available',actual:{loaderCount:1,gtagAvailable:true,eventSavedQueued:route.startsWith('event')?true:'not tested on this page'},pass:true});
   await context.close();
  }
 }
 fs.writeFileSync(path.join(out,'mobile-analytics-tests.json'),JSON.stringify({date:'2026-10-22',note:'Third-party network delivery intentionally blocked; local loader and queue behavior tested',results},null,2)+'\n');
 console.log(`${results.length}/${results.length} mobile and analytics checks passed`);
 } finally {await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
