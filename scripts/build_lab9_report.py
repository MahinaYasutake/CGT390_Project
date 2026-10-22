from pathlib import Path
from xml.sax.saxutils import escape
import os
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import black

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/lab9/Mahina_CGT390_Lab9_API_and_Data_Design_Report.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
fonts=Path(os.environ.get('TIMES_NEW_ROMAN_DIR','/System/Library/Fonts/Supplemental'))
for name,file in [('TNR','Times New Roman.ttf'),('TNRB','Times New Roman Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(fonts/file)))
pdfmetrics.registerFontFamily('TNR',normal='TNR',bold='TNRB')
body=ParagraphStyle('Body',fontName='TNR',fontSize=12,leading=24,textColor=black,spaceAfter=8)
heading=ParagraphStyle('Heading',parent=body,fontName='TNRB',spaceBefore=12,spaceAfter=7,keepWithNext=True)
subhead=ParagraphStyle('Subhead',parent=heading,spaceBefore=7,spaceAfter=3)
story=[]
def p(t): story.append(Paragraph(t,body))
def h(t): story.append(Paragraph(t,heading))
def sh(t): story.append(Paragraph(t,subhead))
def link(url,label): return f'<a href="{escape(url)}" color="#000000">{escape(label)}</a>'
def footer(c,doc):
    c.setFillColor(black);c.setFont('TNR',12)
    c.drawString(54,31,'CGT 390 Lab 9')
    c.drawRightString(558,31,f'Page {doc.page}')
repo='https://github.com/MahinaYasutake/CGT390_Project'
commit='https://github.com/MahinaYasutake/CGT390_Project/commit/0a6d62a925740f38b0d83e428dec8be57fbffa33'
logs=repo+'/tree/master/output/lab9'
code=repo+'/blob/master/event-discovery-app/app.js'
h('CGT 390 Lab 9 API and Data Design Report')
p('Mahina Yasutake | Gatherly | October 22, 2026')
p('<b>Live prototype:</b> '+link('https://cgt-390-project-seven.vercel.app/','cgt-390-project-seven.vercel.app'))
p('<b>Repository:</b> '+link(repo,'github.com/MahinaYasutake/CGT390_Project'))
h('1. Interaction and contract')
p('The interaction is saving Clay Club to a shortlist and removing it later. Gatherly is a static prototype. Saving has no API endpoint, Server Function, account, or database.')
sh('Entry point')
p('A button with data-save="clay-club" calls the click handler in '+link(code+'#L115','app.js, lines 115-130')+'. The handler calls toggleSaved(id), writes a list of IDs to localStorage, then updates the interface. On reload, getSaved() reads the same key. These are browser functions.')
sh('Annotated flow')
p('Event Details button → toggleSaved(event ID) → validate ID against the six-event catalog → localStorage key gatherly-saved-events → Saved Events view. The event array supplies public event details; the saved list contains only references to them.')
sh('Contract')
p('Input: a string ID for an existing event. Rule: each ID must exist in the catalog and appear once in the saved list. A second click removes it. Success returns ok:true, the normalized IDs, the selected ID, and saved:true or false. Invalid input or a failed storage write returns ok:false with an error. No save HTTP status exists.')
h('2. Data and access decisions')
p('The event ID links a saved-list entry to a fictional catalog record. The JavaScript event array is the catalog source of truth; localStorage is the shortlist store for one browser profile and origin. It is not an account record. The list is limited to valid, unique event IDs; malformed stored data displays as empty until a later valid write.')
p('All event details are public in app.js. The shortlist stores no email, token, or payment field. Anonymous visitors may save; anyone using the same browser profile and origin can use that shortlist. Different origins have separate storage, but there is no user authorization or server validation. Lab 8 account-backed saves and database constraints remain a proposal.')
h('3. Testing evidence')
p('Tests used fictional records in isolated Chrome browser contexts on October 22. Identity for each case was an anonymous visitor. Results are function returns, page behavior, and raw localStorage values; save has no separate HTTP response. The complete predicted and actual results are in '+link(logs,'the before and after test logs')+'.')
sh('T1 Successful action')
p('<b>Input and prediction:</b> Save clay-club, reload, then remove and reload. Expect one saved event followed by none. <b>Actual:</b> storage was ["clay-club"] with one saved card, then [] with zero cards. Reload confirmed both writes persisted. Passed before and after the repair.')
sh('T2 Invalid input')
p('<b>Input and prediction:</b> Change data-save to not-real and an empty ID; expect rejection without a write. <b>Actual before:</b> storage became ["not-real",""]. <b>After:</b> storage stayed null and the page returned “This event is not available to save.” Validation in toggleSaved explains the change; retest passed.')
sh('T3 Access boundary')
p('<b>Input and prediction:</b> Save at port 4189, visit the same app at port 4191, then return. Expect the second origin empty and the first unchanged. <b>Actual:</b> the second origin had no saved card; the first retained ["clay-club"]. Passed. This checks origin separation, not account ownership.')
sh('T8 Task specific edge case')
p('<b>Input and prediction:</b> Open event.html?id=not-real. Expect “Event not found,” no Save button, and unchanged storage. <b>Actual before:</b> the page substituted Night Market. <b>After:</b> it showed “Event not found,” no Save button, and storage remained null. The static page request returned HTTP 200; the application displayed the missing-record result.')
h('4. Findings and response')
p('The baseline passed 2 of 8 checks. The six failing cases involved invalid IDs, malformed or wrongly shaped storage, duplicates, storage write failure, and unknown detail links. I added ID and list validation, safe parsing, duplicate removal, visible write-failure feedback, and a missing-event state in '+link(commit,'commit 0a6d62a')+'. All eight affected and unaffected checks passed after repair, plus a direct function validation check.')
p('Selected evidence: invalid IDs changed storage from ["not-real",""] before repair to null after repair; a malformed value {broken caused a page error before repair but rendered with count 0 after repair. Successful saves were checked after reload; rejected writes were checked for unchanged storage. '+link(logs,'Full logs and selected screenshots')+' record the remaining cases.')
p('The merged prototype also restores the documented Lab 7 mobile and deferred analytics behavior. Eleven local responsive and analytics checks and three live task flows passed. The Lab 6 accessibility repairs were verified in the live prototype, including result announcements and the Save button state.')
p('Remaining limits: no account authorization, database persistence, reservation, or concurrent-write protection. External analytics delivery was not tested. These are outside the current browser-local contract.')
h('5. Peer review and AI use')
sh('Peer review')
p('Pending. No classmate has yet proposed and run an additional case, so there is no peer result to report. Share the contract above and ask a classmate to choose a new case, such as two tabs changing the shortlist. Record their input, prediction, actual result, and any repair or blocker before submission.')
sh('AI use and sharing')
p('ChatGPT/Codex reviewed the code and lab documents, built and ran the tests, implemented repairs, and drafted this report. The claims above were checked against the code, browser results, and stored values. Student review remains outstanding. For class sharing: the key rule is that a saved ID must name one catalog event; changing the button to an unknown ID exposed the original failure.')
doc=SimpleDocTemplate(str(OUT),pagesize=(612,792),leftMargin=54,rightMargin=54,topMargin=45,bottomMargin=54,title='CGT 390 Lab 9 API and Data Design Report',author='Mahina Yasutake')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT)
