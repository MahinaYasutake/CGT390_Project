# CGT 390 Lab 4 SEO GEO Page Audit

## Page and search need

- **Selected page:** Gatherly Explore Events
- **URL:** https://cgt-390-project-seven.vercel.app/explore.html
- **Intended user:** A person looking for a local or online activity and comparing options before deciding what to attend.
- **Important task:** Find an event that matches an interest, schedule, location, and budget, then open its details or save it for later.
- **Likely search query:** beginner-friendly creative workshops and local events

This page helps **people looking for a beginner-friendly activity** when they search for **creative workshops and local events**.

## Audit evidence

| Lens | Evidence | Interpretation |
|---|---|---|
| Access and inclusion | The deployed page loads publicly over HTTPS. The page uses one H1, labeled search input, semantic navigation, visible event links, and keyboard-oriented buttons. No robots restriction was found in the page source. | The page is accessible to a public user and gives search systems a readable HTML entry point. |
| Search relevance | Before the revision, the title was “Explore events - Gatherly,” the description was generic, and the H1 was “Explore events.” The page content did not name creative workshops or local events in its primary metadata or heading. | A searcher using the likely query would receive too little context from the result title and snippet. |
| Content and images | The page displays six event cards with event names, dates, times, locations, categories, prices, and links to detail pages. The visual cards are CSS-based rather than content images, so no meaningful image alt text is required for the event-card visuals. | The visible content supports comparison, but the page should state its event categories and audience more directly. |
| Connections | The header, hero navigation, result cards, and each event title link to connected pages. The Explore page links to individual event details and Saved Events is available in the main navigation. | The page supports the discovery path, with descriptive event-name links leading to details. |
| Evidence and data | The page includes a canonical URL and a CollectionPage JSON-LD block whose name, description, and URL match the visible page. The data is limited to facts actually represented on the page. | Search systems receive a consistent page identity and content summary without unsupported event or review claims. |
| Generated use | A focused answer can correctly identify the two Creative events, their dates, locations, prices, and beginner-friendly language from the page. The page also states that saved events are only stored in the browser and that saving does not reserve a spot. | The page is usable as a source for basic event facts, but it does not provide real availability, registration, or city context. |

## Part 4 Two questions to answer

The audit uses two focused questions instead of assigning one general SEO score:

1. **Can a searcher and search system understand that this page is a collection of creative workshops and local events?**
2. **Can a search or generative system identify the page as the authoritative source for the event facts shown to the user?**

The first question is answered through the title, meta description, H1, opening content, and visible event categories. The second is answered through the canonical URL, CollectionPage structured data, consistent visible facts, and the linked event-detail pages.

## Findings and evidence-to-verification records

### Finding 1 Search intent was too vague in metadata and headings

- **Evidence:** Before the change, the page title was “Explore events | Gatherly,” the meta description said “Explore fictional Gatherly events by search and category,” and the H1 said “Explore events.”
- **Interpretation:** These labels identify the page type but do not tell a searcher that the page includes creative workshops, local events, wellness activities, and online gatherings. The result may be harder to match to the likely search need.
- **Recommendation:** Use a specific title, description, H1, and opening paragraph that name the page’s actual event categories and intended task.
- **Verification:** The live page now shows the title “Creative Workshops and Local Events | Gatherly,” the H1 “Find creative workshops and local events,” and opening copy that names creative workshops, community gatherings, wellness activities, and online conversations.
- **Limitation:** Immediate inspection confirms the content is present and coherent, but it cannot prove improved rankings, impressions, or click-through rate.

### Finding 2 The page lacked explicit machine-readable page identity

- **Evidence:** Before the change, the page source contained no canonical link and no JSON-LD structured data.
- **Interpretation:** Search and generative systems had less explicit information connecting the page title, description, and URL to one collection page. This can make source identification and interpretation less consistent.
- **Recommendation:** Add a canonical URL and a CollectionPage JSON-LD block using only the page’s visible, accurate purpose and URL.
- **Verification:** The live source contains `rel="canonical"` pointing to the deployed Explore URL and a JSON-LD `CollectionPage` whose name, description, URL, and Gatherly website relationship match the page.
- **Limitation:** Markup validation and source inspection do not guarantee that a search engine will display a rich result or that a generative system will cite the page.

### Finding 3 The page provides useful comparison facts but not real availability

- **Evidence:** Each visible event card includes a title, date, time, location, category, price, and link to details. The detail page states that saving an event does not reserve a spot.
- **Interpretation:** The information supports shortlisting, but users cannot confirm capacity, registration status, or whether an event is in a named city.
- **Recommendation:** If this prototype becomes a real product, add a clearly labeled city or region and an authoritative registration or availability source. Keep the current fictional-data disclosure while it remains a prototype.
- **Verification:** Immediate inspection confirms the cards and detail links expose the comparison facts and that the save limitation is stated.
- **Limitation:** Real availability and registration accuracy require a connected event source and repeated data checks.

## Part 5 Generated-answer check

**Focused question asked of the AI system:** “According to Gatherly’s Explore Events page, what beginner-friendly creative events can a user consider, and what are the date, location, and price of each?”

**Generated answer summary:** The page offers Clay Club: Make a Useful Thing and Poster Lab for Beginners. Clay Club is listed for Sat, Sep 19 at 10:00 AM at Morrow Art House for $18. Poster Lab is listed for Thu, Sep 24 at 6:00 PM at The Print Pantry for $22.

| Claim checked | Supporting page evidence | Classification |
|---|---|---|
| The page offers Clay Club and Poster Lab as Creative events. | Both cards are visible under the CREATIVE category on the live Explore page. | Fully supported |
| Clay Club is beginner-friendly and costs $18 at Morrow Art House on Sat, Sep 19 at 10:00 AM. | The Clay Club card shows “Beginner friendly” on its detail page and shows the date, time, location, and price across the connected page flow. | Fully supported |

Missing context: the prototype does not identify a real city, does not provide verified capacity or registration, and uses fictional event data. The page does state that the events are fictional and that saving does not reserve a spot. One change that would make the information easier to use is adding a clear city or region field to each event once the prototype has a defined geographic scope.

## Part 6 Priorities and Part 7 Prototype implementation

The two highest-priority improvements were selected because they support both the user’s discovery task and the likely search need:

1. Make the page’s search intent explicit in the title, meta description, H1, and opening copy.
2. Give the page a consistent machine-readable identity with a canonical URL and accurate CollectionPage structured data.

## Before-and-after evidence

**Updated prototype:** https://cgt-390-project-seven.vercel.app/explore.html

1. **Search-intent improvement**
   - **Before:** “Explore events | Gatherly”; H1 “Explore events”; generic opening sentence.
   - **After:** “Creative Workshops and Local Events | Gatherly”; H1 “Find creative workshops and local events”; opening copy names the actual categories and discovery task.

2. **Source-identity improvement**
   - **Before:** No canonical URL or structured data in the page source.
   - **After:** Canonical URL points to the deployed Explore page, and JSON-LD identifies it as a CollectionPage with matching name, description, URL, and website relationship.

## Immediate validation and later measurement plan

Immediate checks completed:

- Public HTTPS page loads successfully.
- Updated title, H1, opening copy, canonical URL, and JSON-LD are present in the deployed source.
- Explore page renders six event cards.
- Searching for “clay” reduces the results to one event.
- Event titles link to connected detail pages.
- Browser console check remains at zero errors from the existing baseline testing.

Later measurement plan:

- Use Search Console after the page has enough impressions to compare impressions, average position, CTR, and queries related to “creative workshops” and “local events.”
- Use analytics to measure Explore-page visits, search/filter use, event-detail clicks, and saves.
- Repeat the generated-answer check with the same question after content changes and compare whether the system identifies the correct page, facts, and limitations.
- If the prototype gains real event data, monitor source freshness, availability accuracy, and consistency between visible content and structured data.

## AI-use statement

AI supported this lab as a research, writing, and implementation assistant. It helped identify audit evidence in the existing Gatherly files, organize the findings, suggest clearer metadata and structured-data improvements, update the Explore page, and check the deployed page after the changes were published. It also helped organize the evidence and validation results into this report.

Human direction remained responsible for the important decisions. I selected Gatherly as the case-study prototype, chose the Explore Events page, defined the intended user and likely search query, and decided which user task the audit should prioritize. I reviewed the suggested changes and limited the implementation to two improvements that fit the page: clearer search intent and stronger page identity. I also chose to keep the event data fictional, avoided claiming real availability or rankings, and rejected unsupported SEO additions. After implementation, I reviewed the deployed page, confirmed that the title, H1, metadata, canonical URL, and structured data matched the visible content, and tested the event search behavior. The AI helped carry out and document these steps, but the scope, judgment, fact-checking, and final decisions remained human-directed.

## Brief presentation summary

Gatherly’s Explore Events page supports people who want to compare local or online activities. The initial page worked functionally, but its title and H1 were too generic for the likely search need, and it had no explicit canonical or structured page identity. I changed the page to name creative workshops and local events directly, added a matching description and opening paragraph, and added a canonical URL plus CollectionPage JSON-LD. I verified the deployed source, confirmed the page renders six events, and tested a search for “clay,” which returned one matching event. These checks confirm implementation, but Search Console, analytics, and repeated AI testing are still needed to measure search visibility and generative use over time.
