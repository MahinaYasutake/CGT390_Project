from pathlib import Path
from xml.sax.saxutils import escape
import os

from reportlab.lib.colors import black
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Image, PageBreak, Paragraph, SimpleDocTemplate

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/lab9/Mahina_CGT390_Lab9_API_and_Data_Design_Report.pdf'
fonts = Path(os.environ.get('TIMES_NEW_ROMAN_DIR', '/System/Library/Fonts/Supplemental'))
for name, filename in [('TNR', 'Times New Roman.ttf'), ('TNRB', 'Times New Roman Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(fonts / filename)))
pdfmetrics.registerFontFamily('TNR', normal='TNR', bold='TNRB')
body = ParagraphStyle('Body', fontName='TNR', fontSize=12, leading=24, textColor=black, spaceAfter=3)
title = ParagraphStyle('Title', parent=body, fontName='TNRB', fontSize=16, leading=20, spaceAfter=10)
heading = ParagraphStyle('Heading', parent=body, fontName='TNRB', fontSize=14, leading=18, spaceBefore=9, spaceAfter=5, keepWithNext=True)
subhead = ParagraphStyle('Subhead', parent=heading, fontSize=13, leading=16, spaceBefore=5, spaceAfter=2)
story = []


def add(style, text):
    story.append(Paragraph(text, style))


def link(url, label):
    return f'<a href="{escape(url)}" color="#000000">{escape(label)}</a>'


def footer(canvas, doc):
    canvas.setFillColor(black)
    canvas.setFont('TNR', 12)
    canvas.drawString(54, 31, 'CGT 390 Lab 9 | API and Data Design')
    canvas.drawRightString(558, 31, f'Page {doc.page}')


repo = 'https://github.com/MahinaYasutake/CGT390_Project'
branch = repo + '/tree/codex/lab9-backend-database'
api = repo + '/blob/codex/lab9-backend-database/event-discovery-app/api/saved.js'
client = repo + '/blob/codex/lab9-backend-database/event-discovery-app/app.js'
catalog = repo + '/blob/codex/lab9-backend-database/event-discovery-app/catalog.js'
log = repo + '/blob/codex/lab9-backend-database/output/lab9/backend-test-log.json'
ui_log = repo + '/blob/codex/lab9-backend-database/output/lab9/backend-ui-tests.json'
preview_log = repo + '/blob/codex/lab9-backend-database/output/lab9/preview-verification.json'
production_log = repo + '/blob/master/output/lab9/production-backend-verification.json'
before_log = repo + '/blob/master/output/lab9/before-tests.json'
after_log = repo + '/blob/master/output/lab9/after-tests.json'

add(title, 'CGT 390 Lab 9 API and Data Design Report')
add(body, 'Mahina Yasutake | Gatherly | October 22, 2026')
add(body, '<b>Live prototype:</b> ' + link('https://cgt-390-project-seven.vercel.app/', 'cgt-390-project-seven.vercel.app'))
add(body, '<b>Backend preview:</b> ' + link('https://cgt-390-project-git-codex-lab9-backend-database-mahinay.vercel.app/', 'cgt-390-project-git-codex-lab9-backend-database-mahinay.vercel.app'))
add(body, '<b>Backend branch:</b> ' + link(branch, 'github.com/MahinaYasutake/CGT390_Project/tree/codex/lab9-backend-database'))
add(body, '<b>Implementation status:</b> The backend and database are deployed on the public live URL. Local, preview, and production checks passed on October 22. The peer test remains pending.')

add(heading, '1. Interaction and contract')
add(body, 'The task is to save Clay Club to a shortlist, see it after a reload, and remove it later. The revised prototype sends this action to a server API backed by an SQLite-compatible database.')
add(subhead, 'Entry point')
add(body, 'The Save button in ' + link(client, 'app.js') + ' sends POST /api/saved with JSON {"eventId":"clay-club"}. ' + link(api, 'api/saved.js') + ' validates the request, derives an anonymous visitor from an HttpOnly cookie, writes the database row, and returns the current IDs. GET /api/saved reads the list; DELETE /api/saved?eventId=clay-club removes one item.')
add(subhead, 'Annotated flow')
add(body, 'Save button → POST /api/saved → request validation and visitor cookie → events table ID check → saved_events insert → JSON response → Saved Events view. The public catalog supplies display details; saved_events stores the visitor-event relationship.')
add(subhead, 'Contract')
add(body, 'POST accepts exactly one field, eventId, as a string. A new save returns HTTP 201 with eventId, saved:true, and ids; a duplicate returns 200 with the same single saved row. DELETE returns 200 with saved:false and updated ids. A malformed body returns 400 INVALID_BODY; an unknown event returns 404 EVENT_NOT_FOUND; database unavailability returns 503 SAVE_SERVICE_UNAVAILABLE.')

add(heading, '2. Data and access decisions')
add(body, 'The events table contains catalog IDs. saved_events contains visitor_id, event_id, and created_at. Its (visitor_id, event_id) primary key prevents duplicates; event_id has a foreign key to events. The shared ' + link(catalog, 'catalog.js') + ' array supplies public event details and seeds valid IDs in the database. The database is the source of truth for saved relationships.')
add(body, 'The server creates a random visitor cookie and stores a hash of it as visitor_id. It never accepts a visitor ID from request JSON. Every read and write is scoped to that derived ID, so one anonymous browser cannot target another visitor’s rows through the API. The cookie is HttpOnly and SameSite=Lax. This is anonymous ownership, not a signed-in account; clearing the cookie loses access to the list. No email, token, or payment field is returned.')

add(heading, '3. Testing evidence')
add(body, 'The API ran against a temporary real database on October 22. Predictions were compared with HTTP responses and follow-up reads. The sanitized ' + link(log, 'local API log') + ' omits cookie values; the ' + link(ui_log, 'local browser log') + ' records screen behavior. The ' + link(preview_log, 'preview check') + ' and ' + link(production_log, 'production check') + ' record hosted behavior. Core HTTP outcomes were repeated on production.')
add(subhead, 'T1 Successful action')
add(body, '<b>Input/identity:</b> Visitor A POST {"eventId":"clay-club"}, then GET. <b>Prediction:</b> 201 and one saved ID after the read. <b>Actual:</b> 201 {"eventId":"clay-club","saved":true,"ids":["clay-club"]}; GET retained the ID. The local browser showed Saved 1 after reload. The insert and subsequent SELECT demonstrate persistence.')
add(subhead, 'T2 Invalid input')
add(body, '<b>Input/identity:</b> Visitor A POST {"eventId":42}; then POST {"eventId":"not-real"}. <b>Prediction:</b> reject both and leave the list unchanged. <b>Actual:</b> 400 {"error":"INVALID_BODY"} and 404 {"error":"EVENT_NOT_FOUND"}; GET still showed ["clay-club"]. Type validation and the events-table lookup explain the two results.')
add(subhead, 'T3 Access boundary')
add(body, '<b>Input/identity:</b> Visitor B GET, then DELETE clay-club; A GET again. <b>Prediction:</b> B starts empty and cannot remove A’s save. <b>Actual:</b> B’s initial GET returned {"ids":[]}; after B’s delete, A’s GET still returned {"ids":["clay-club"]}. A forged visitorId field in POST returned 400. The server-derived cookie identity and visitor-scoped SQL explain the boundary.')
add(subhead, 'T4 Task-specific edge case')
add(body, '<b>Input/identity:</b> Visitor A repeats POST clay-club. <b>Prediction:</b> a second request leaves one row. <b>Actual:</b> HTTP 200 returned the same one-item list. The composite primary key and INSERT OR IGNORE explain the result. A direct insert with a nonexistent event ID was rejected by the foreign key.')

add(heading, '4. Findings and response')
add(body, 'The original browser-storage review found two defects: invalid IDs were saved, and unknown detail links showed a different event. The ' + link(before_log, 'before log') + ' shows ["not-real",""]; the ' + link(after_log, 'retest log') + ' shows no write after the client fix. That repair is live.')
add(body, 'Server validation and database constraints enforce the save rule. Four local browser checks passed: reload persistence, two-tab consistency, visitor isolation, and migration of old localStorage IDs. On the public URL, a save remained after reload, appeared on the Saved page, and disappeared after removal. Production API checks repeated success, duplicate, invalid, unknown, and access-boundary cases; the test row was removed.')
story.append(PageBreak())
add(subhead, 'Production browser evidence')
add(body, 'The Saved page below shows Clay Club after the production save and page navigation. The browser then removed it and displayed Saved 0.')
story.append(Image(str(ROOT / 'output/lab9/production-saved-populated.png'), width=432, height=243, hAlign='CENTER'))
add(body, '<b>Remaining work:</b> A classmate still needs to try one independent case. Anonymous cookies do not create accounts; reservations and capacity checks remain outside scope.')

add(heading, '5. Peer review and AI use')
add(subhead, 'Peer review')
add(body, 'Pending: no classmate has yet proposed and run an additional case. The peer should try a fifth case and report the input, predicted and actual result, and any fix or clarification.')
add(subhead, 'AI use')
add(body, 'ChatGPT/Codex reviewed the code, built and ran the tests, implemented repairs, and drafted this report. The claims above were checked against the code, browser results, and stored values. I reviewed the document, decided on which action to investigate, and drafted parts of this report.')

doc = SimpleDocTemplate(str(OUT), pagesize=(612, 792), leftMargin=48, rightMargin=48, topMargin=36, bottomMargin=42, title='CGT 390 Lab 9 API and Data Design Report', author='Mahina Yasutake')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
