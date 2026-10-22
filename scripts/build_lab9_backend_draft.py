from pathlib import Path
from xml.sax.saxutils import escape
import os

from reportlab.lib.colors import black
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/lab9/Mahina_CGT390_Lab9_Backend_Draft.pdf'
fonts = Path(os.environ.get('TIMES_NEW_ROMAN_DIR', '/System/Library/Fonts/Supplemental'))
for name, filename in [('TNR', 'Times New Roman.ttf'), ('TNRB', 'Times New Roman Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(fonts / filename)))
pdfmetrics.registerFontFamily('TNR', normal='TNR', bold='TNRB')
body = ParagraphStyle('Body', fontName='TNR', fontSize=12, leading=24, textColor=black, spaceAfter=6)
title = ParagraphStyle('Title', parent=body, fontName='TNRB', fontSize=16, leading=20, spaceAfter=10)
heading = ParagraphStyle('Heading', parent=body, fontName='TNRB', fontSize=14, leading=18, spaceBefore=12, spaceAfter=7, keepWithNext=True)
subhead = ParagraphStyle('Subhead', parent=heading, fontSize=13, leading=16, spaceBefore=7, spaceAfter=3)
story = []


def add(style, text):
    story.append(Paragraph(text, style))


def link(url, label):
    return f'<a href="{escape(url)}" color="#000000">{escape(label)}</a>'


def footer(canvas, doc):
    canvas.setFillColor(black)
    canvas.setFont('TNR', 12)
    canvas.drawString(54, 31, 'CGT 390 Lab 9 | Backend draft')
    canvas.drawRightString(558, 31, f'Page {doc.page}')


repo = 'https://github.com/MahinaYasutake/CGT390_Project'
branch = repo + '/tree/codex/lab9-backend-database'
api = repo + '/blob/codex/lab9-backend-database/event-discovery-app/api/saved.js'
client = repo + '/blob/codex/lab9-backend-database/event-discovery-app/app.js'
catalog = repo + '/blob/codex/lab9-backend-database/event-discovery-app/catalog.js'
log = repo + '/blob/codex/lab9-backend-database/output/lab9/backend-test-log.json'

add(title, 'CGT 390 Lab 9 API and Data Design Report — Backend Draft')
add(body, 'Mahina Yasutake | Gatherly | October 22, 2026')
add(body, '<b>Live prototype:</b> ' + link('https://cgt-390-project-seven.vercel.app/', 'cgt-390-project-seven.vercel.app'))
add(body, '<b>Backend branch:</b> ' + link(branch, 'github.com/MahinaYasutake/CGT390_Project/tree/codex/lab9-backend-database'))
add(body, '<b>Status:</b> The API and database passed local tests. The live URL still serves the browser-local version until a persistent cloud database is connected and deployment is verified.')

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
add(body, 'The local API ran against a temporary real database on October 22. Each prediction was checked against the HTTP response and a subsequent read. The sanitized ' + link(log, 'test log') + ' contains every case and omits visitor cookie values. The browser UI was also checked by saving on Explore, reloading, and viewing Saved Events.')
add(subhead, 'T1 Successful action')
add(body, '<b>Prediction:</b> POST clay-club as visitor A returns 201; GET returns one saved ID. <b>Actual:</b> 201 {"eventId":"clay-club","saved":true,"ids":["clay-club"]}; GET returned the same ID. The local browser showed Saved 1 after reload.')
add(subhead, 'T2 Invalid input')
add(body, '<b>Prediction:</b> POST eventId 42 is rejected without a write. <b>Actual:</b> 400 {"error":"INVALID_BODY"}; the saved list stayed ["clay-club"]. POST not-real returned 404 EVENT_NOT_FOUND and also left the list unchanged.')
add(subhead, 'T3 Access boundary')
add(body, '<b>Prediction:</b> visitor B starts empty and cannot remove visitor A’s save. <b>Actual:</b> B’s GET returned {"ids":[]}; B’s DELETE clay-club left A’s GET at {"ids":["clay-club"]}. A POST body with an extra visitorId field returned 400. SQL WHERE visitor_id = ? explains the isolation.')
add(subhead, 'T4 Task-specific edge case')
add(body, '<b>Prediction:</b> a repeated POST clay-club must not create a duplicate. <b>Actual:</b> HTTP 200 returned the same one-item ids list. The database primary key enforced uniqueness. A direct insert with a nonexistent event ID was rejected by the foreign key.')

add(heading, '4. Findings and response')
add(body, 'The earlier live prototype used only localStorage. After the professor clarified that a backend and database are expected, the revised prototype added a server endpoint, persistent-row model, server-side validation, visitor-scoped queries, database constraints, and a one-time transfer of earlier saved IDs. The new local API test passed all asserted cases, and four local browser checks passed, including two-tab saving and migration.')
add(body, 'Remaining work: connect a persistent cloud database to Vercel, deploy this branch, and repeat the HTTP and browser tests at the live URL. Until then, the live prototype still uses localStorage. The anonymous cookie is not an account, and reservations, concurrent availability checks, and third-party analytics delivery remain outside this tested scope.')

add(heading, '5. Peer review and AI use')
add(subhead, 'Peer review')
add(body, 'Pending. No classmate has yet proposed and run an additional case. Share the new API contract and ask a classmate to select and try a different test. Record their input, expected result, actual status and response, and any fix or clarification.')
add(subhead, 'AI use')
add(body, 'ChatGPT/Codex reviewed the code, built and ran the tests, implemented repairs, and drafted this report. The claims above were checked against the code, browser results, and stored values. I reviewed the document, decided on which action to investigate, and drafted parts of this report.')

doc = SimpleDocTemplate(str(OUT), pagesize=(612, 792), leftMargin=54, rightMargin=54, topMargin=42, bottomMargin=50, title='CGT 390 Lab 9 API and Data Design Report — Backend Draft', author='Mahina Yasutake')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
