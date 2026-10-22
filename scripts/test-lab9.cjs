const {chromium} = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');
const root=path.resolve(__dirname,'..'), phase=process.argv[2] || 'after';
const folder=path.resolve(process.env.LAB9_APP_DIR || path.join(root,'event-discovery-app'));
const evidenceDir=path.resolve(process.env.LAB9_EVIDENCE_DIR || path.join(root,'output/lab9'));
fs.mkdirSync(evidenceDir,{recursive:true});
const key='gatherly-saved-events';
const serve=port=>new Promise(resolve=>{const server=http.createServer((req,res)=>{const filename=path.resolve(folder,'.'+new URL(req.url,'http://localhost').pathname); if(!filename.startsWith(folder+path.sep)){res.writeHead(403);return res.end();} fs.readFile(filename,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',filename.endsWith('.js')?'text/javascript':filename.endsWith('.css')?'text/css':'text/html');res.end(data);});});server.listen(port,'127.0.0.1',()=>resolve(server));});
(async()=>{
 const servers=await Promise.all([serve(4189),serve(4191)]);
 const browser=await chromium.launch({...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),headless:true});
 const log={phase,date:'2026-10-22',architecture:'Static HTML and browser localStorage; no save HTTP endpoint',tests:[]};
 async function run(id,input,expected,fn){
  const context=await browser.newContext({viewport:{width:1100,height:850}});
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4189/event.html?id=clay-club');
  let actual,pass=false;
  try {({actual,pass}=await fn(page,context,errors));}catch(e){actual={testError:e.message,pageErrors:errors};}
  const row={id,input,identity:'Anonymous visitor in isolated test browser context',expected,actual,pass}; log.tests.push(row);
  console.log(JSON.stringify(row)); await context.close();
 }
 const state=page=>page.evaluate(k=>({stored:localStorage.getItem(k),count:document.querySelector('.saved-count')?.textContent,button:document.querySelector('[data-save]')?.textContent,status:document.querySelector('[data-save-status]')?.textContent}),key);
 await run('T1','Save clay-club, reload, open Saved Events, remove, reload','One saved ID persists across reload; removing persists as []',async page=>{
  await page.locator('[data-save="clay-club"]').click(); await page.reload(); const saved=await state(page); await page.goto('http://127.0.0.1:4189/saved.html'); const cards=await page.locator('.event-card').count(); await page.locator('[data-save="clay-club"]').click(); await page.reload(); const removed=await state(page);
  return {actual:{saved,cards,removed},pass:saved.stored==='["clay-club"]'&&cards===1&&removed.stored==='[]'&&removed.count==='0'};
 });
 await run('T2','Change data-save to not-real then click; repeat with empty ID','Reject unknown and empty IDs; raw storage unchanged; show failure',async page=>{
  await page.locator('[data-save]').evaluate(el=>el.dataset.save='not-real'); await page.locator('[data-save]').click(); const unknown=await state(page);
  await page.locator('[data-save]').first().evaluate(el=>el.dataset.save=''); await page.locator('[data-save]').first().click(); const empty=await state(page);
  return {actual:{unknown,empty},pass:unknown.stored===null&&empty.stored===null&&Boolean(empty.status)};
 });
 await run('T3','Save at port 4189; visit same app at port 4191; return to 4189','Different origin starts empty; original origin retains clay-club',async page=>{
  await page.locator('[data-save="clay-club"]').click(); await page.goto('http://127.0.0.1:4191/saved.html'); const other=await state(page); const cards=await page.locator('.event-card').count(); await page.goto('http://127.0.0.1:4189/saved.html'); const original=await state(page);
  return {actual:{other,cards,original},pass:other.stored===null&&cards===0&&original.stored==='["clay-club"]'};
 });
 await run('T4','Set stored value to {broken then reload','Page renders without uncaught error; count 0; raw value unchanged',async(page,context,errors)=>{
  await page.evaluate(k=>localStorage.setItem(k,'{broken'),key); await page.reload(); const actual={...await state(page),pageErrors:errors};
  await page.screenshot({path:path.join(evidenceDir,phase+'-corrupt.png'),fullPage:true});
  return {actual,pass:errors.length===0&&actual.count==='0'&&actual.stored==='{broken'&&Boolean(actual.button)};
 });
 await run('T5','Seed object {id:clay-club} and then null; reload each','Both wrong JSON shapes render safely as empty; no uncaught error',async(page,context,errors)=>{
  const values=[]; for(const value of ['{"id":"clay-club"}','null']){await page.evaluate(([k,v])=>localStorage.setItem(k,v),[key,value]);await page.reload();values.push(await state(page));}
  return {actual:{values,pageErrors:errors},pass:errors.length===0&&values.every(v=>v.count==='0'&&Boolean(v.button))};
 });
 await run('T6','Seed [clay-club,clay-club,not-real,7]; reload then save poster-lab','Display one valid save; next successful write stores unique known IDs only',async page=>{
  await page.evaluate(k=>localStorage.setItem(k,JSON.stringify(['clay-club','clay-club','not-real',7])),key);await page.reload();const read=await state(page);
  await page.goto('http://127.0.0.1:4189/event.html?id=poster-lab'); await page.locator('[data-save="poster-lab"]').click(); const write=await state(page);
  return {actual:{read,write},pass:read.count==='1'&&write.stored==='["clay-club","poster-lab"]'&&write.count==='2'};
 });
 await run('T7','Make Storage.prototype.setItem throw QuotaExceededError then click Save','No false success; stored value unchanged; visible error; no uncaught error',async(page,context,errors)=>{
  await page.evaluate(()=>Storage.prototype.setItem=function(){throw new DOMException('Fictional test quota failure','QuotaExceededError');});await page.locator('[data-save="clay-club"]').click();const actual={...await state(page),pageErrors:errors};
  await page.screenshot({path:path.join(evidenceDir,phase+'-storage-failure.png'),fullPage:true});
  return {actual,pass:actual.stored===null&&actual.button.includes('Save event')&&Boolean(actual.status)&&errors.length===0};
 });
 await run('T8','Open event.html?id=not-real','Show Event not found and no save button; do not silently substitute another event',async page=>{
  const response=await page.goto('http://127.0.0.1:4189/event.html?id=not-real'); const actual={httpStatus:response.status(),heading:await page.locator('h1').textContent(),saveButtons:await page.locator('[data-save]').count(),stored:await page.evaluate(k=>localStorage.getItem(k),key)};
  return {actual,pass:actual.heading==='Event not found'&&actual.saveButtons===0&&actual.stored===null};
 });
 if (phase === 'after') await run('T9','Call setSaved with an object, a mixed-type list, then duplicate valid IDs; call toggleSaved with an object','Reject invalid types without mutation; deduplicate valid write; return explicit results',async page=>{
  const actual=await page.evaluate(k=>{
   const object=setSaved({id:'clay-club'}); const mixed=setSaved(['clay-club',7]); const rejectedStorage=localStorage.getItem(k);
   const valid=setSaved(['clay-club','clay-club']); const invalidToggle=toggleSaved({id:'clay-club'}); const finalStorage=localStorage.getItem(k);
   return {object,mixed,rejectedStorage,valid,invalidToggle,finalStorage};
  },key);
  return {actual,pass:!actual.object.ok&&!actual.mixed.ok&&actual.rejectedStorage===null&&actual.valid.ok&&actual.finalStorage==='["clay-club"]'&&!actual.invalidToggle.ok};
 });
 fs.writeFileSync(path.join(evidenceDir,phase+'-tests.json'),JSON.stringify(log,null,2)+'\n');
 await browser.close();await Promise.all(servers.map(s=>new Promise(r=>s.close(r))));
 console.log(`${phase}: ${log.tests.filter(t=>t.pass).length}/${log.tests.length} passed`);
 if (log.tests.some(t=>!t.pass)) process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1);});
