const events = [
  {id:'night-market',title:'Night Market & Tiny Concerts',date:'Fri, Sep 18 · 6:30 PM',location:'Riverside Warehouse',category:'Community',color:'coral',tag:'FOOD · MUSIC',description:'An evening of local makers, warm food, and three tiny concerts tucked into a neighborhood warehouse. Come curious, leave connected.',organizer:'Riverside Neighbors',price:'Pay what you can',duration:'3 hours',audience:'All ages',materials:'Not needed',attendance:'Drop in welcome'},
  {id:'clay-club',title:'Clay Club: Make a Useful Thing',date:'Sat, Sep 19 · 10:00 AM',location:'Morrow Art House',category:'Creative',color:'yellow',tag:'HANDS-ON',description:'A relaxed morning learning the basics of hand-building clay. You’ll leave with one useful, slightly wonky object and a new creative habit.',organizer:'Morrow Art House',price:'$18',duration:'2 hours',audience:'Beginner friendly',materials:'Included',attendance:'Save your spot before arriving'},
  {id:'slow-sunday',title:'Slow Sunday: Stretch & Reset',date:'Sun, Sep 20 · 9:00 AM',location:'Juniper Park',category:'Wellness',color:'blue',tag:'OUTDOORS',description:'Start the week gently with an all-levels stretch, a short guided walk, and a quiet cup of tea among good company.',organizer:'Open Pace Collective',price:'$10',duration:'90 minutes',audience:'All levels',materials:'Bring a mat',attendance:'All spots welcome'},
  {id:'future-hours',title:'Office Hours for the Future',date:'Tue, Sep 22 · 7:00 PM',location:'Online · Gatherly Rooms',category:'Online',color:'lavender',tag:'CONVERSATION',description:'A generous, low-pressure conversation about building a more humane relationship with technology and work.',organizer:'Common Thread Studio',price:'Free',duration:'1 hour',audience:'Open conversation',materials:'A device with audio',attendance:'Online room link shared later'},
  {id:'field-notes',title:'Field Notes: A City Walk',date:'Wed, Sep 23 · 5:45 PM',location:'Meet at Bellweather Library',category:'Community',color:'blue',tag:'WALKING',description:'Notice the overlooked details of your own block on a guided walk with a photographer and a handful of friendly strangers.',organizer:'Bellweather Library',price:'Free',duration:'2 hours',audience:'All walking levels',materials:'Comfortable shoes',attendance:'Meet at the library entrance'},
  {id:'poster-lab',title:'Poster Lab for Beginners',date:'Thu, Sep 24 · 6:00 PM',location:'The Print Pantry',category:'Creative',color:'yellow',tag:'DESIGN',description:'Make a bold one-color poster using paper, ink, and a few simple composition tricks. No design experience required.',organizer:'The Print Pantry',price:'$22',duration:'2 hours',audience:'Beginner friendly',materials:'Included',attendance:'Save your spot before arriving'}
];

const savedKey = 'gatherly-saved-events';
const getSaved = () => JSON.parse(localStorage.getItem(savedKey) || '[]');
const isSaved = id => getSaved().includes(id);
const setSaved = ids => localStorage.setItem(savedKey, JSON.stringify(ids));
const eventById = id => events.find(event => event.id === id);

function eventCard(event) {
  return `<article class="event-card"><a href="event.html?id=${event.id}" class="event-image ${event.color}"><span>${event.date.split(' · ')[0]}</span><span>${event.tag}</span></a><div class="event-info"><p class="category">${event.category}</p><h3><a href="event.html?id=${event.id}">${event.title}</a></h3><p class="event-meta"><strong>${event.date.split(' · ')[1]}</strong></p><p class="event-meta">${event.location}</p><div class="card-footer"><span class="muted">${event.price}</span><button class="save-button ${isSaved(event.id) ? 'saved' : ''}" data-save="${event.id}" aria-label="${isSaved(event.id) ? 'Remove' : 'Save'} ${event.title}">${isSaved(event.id) ? '♥' : '♡'}</button></div></div></article>`;
}

function updateSavedCount() { document.querySelectorAll('.saved-count').forEach(node => node.textContent = getSaved().length); }
function renderFeatured() { const target = document.querySelector('[data-featured-events]'); if (target) target.innerHTML = events.slice(0, 3).map(eventCard).join(''); }
function renderExplore() {
  const list = document.querySelector('[data-event-list]'); if (!list) return;
  let filters = {category:'All', date:'All', location:'All', price:'All'}; let query = '';
  const isWeekend = event => ['Fri, Sep 18', 'Sat, Sep 19', 'Sun, Sep 20'].includes(event.date.split(' · ')[0]);
  const draw = () => {
    const filtered = events.filter(event => {
      const matchesCategory = filters.category === 'All' || event.category === filters.category;
      const matchesDate = filters.date === 'All' || filters.date === 'This week' || (filters.date === 'Weekend' && isWeekend(event));
      const isOnline = event.location.startsWith('Online');
      const matchesLocation = filters.location === 'All' || (filters.location === 'Online' && isOnline) || (filters.location === 'Local' && !isOnline);
      const matchesPrice = filters.price === 'All' || (filters.price === 'Free' && event.price === 'Free') || (filters.price === 'Paid' && event.price !== 'Free');
      const matchesQuery = `${event.title} ${event.location} ${event.category}`.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesDate && matchesLocation && matchesPrice && matchesQuery;
    });
    list.innerHTML = filtered.map(eventCard).join(''); document.querySelector('[data-results-count]').textContent = `${filtered.length} event${filtered.length === 1 ? '' : 's'}`; document.querySelector('[data-empty-state]').hidden = filtered.length > 0;
  };
  document.querySelector('[data-search]').addEventListener('input', e => { query = e.target.value; draw(); });
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter; filters[filter] = button.dataset.value;
    document.querySelectorAll(`[data-filter="${filter}"]`).forEach(item => { item.classList.remove('active'); item.setAttribute('aria-pressed','false'); }); button.classList.add('active'); button.setAttribute('aria-pressed','true'); draw();
  }));
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item.classList.contains('active'))));
  draw();
  document.querySelector('[data-reset-filters]').addEventListener('click', () => {
    filters = {category:'All', date:'All', location:'All', price:'All'}; query = '';
    document.querySelector('[data-search]').value = '';
    document.querySelectorAll('[data-filter]').forEach(item => { const active = item.dataset.value === 'All'; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
    draw();
  });
}
function renderDetail() {
  const target = document.querySelector('[data-event-detail]'); if (!target) return;
  const event = eventById(new URLSearchParams(location.search).get('id')) || events[0];
  target.innerHTML = `<a class="detail-back" href="explore.html">← Back to explore</a><div class="detail-layout"><div class="detail-image ${event.color}"><span>${event.category} · ${event.tag}</span><strong>${event.title.split(':')[0]}</strong></div><div class="detail-copy"><p class="eyebrow">${event.category}</p><h1>${event.title}</h1><p>${event.description}</p><div class="detail-facts"><p class="detail-fact"><strong>When</strong><span>${event.date}</span></p><p class="detail-fact"><strong>Where</strong><span>${event.location}</span></p><p class="detail-fact"><strong>Hosted by</strong><span>${event.organizer}</span></p></div><section class="before-you-go" aria-labelledby="before-you-go-title"><p class="eyebrow" id="before-you-go-title">Before you go</p><div class="practical-grid"><p><strong>Duration</strong><span>${event.duration}</span></p><p><strong>Good for</strong><span>${event.audience}</span></p><p><strong>Materials</strong><span>${event.materials}</span></p><p><strong>Attendance</strong><span>${event.attendance}</span></p></div></section><div class="detail-actions"><button class="button" data-save="${event.id}" aria-describedby="save-note">${isSaved(event.id) ? '♥ Saved' : '♡ Save event'}</button><span class="muted">${event.price}</span></div><p class="save-note" id="save-note">Save this event to your shortlist. Saving does not reserve a spot.</p></div></div>`;
}
function renderSaved() { const target = document.querySelector('[data-saved-events]'); if (!target) return; const saved = events.filter(event => getSaved().includes(event.id)); target.innerHTML = saved.map(eventCard).join(''); document.querySelector('[data-saved-empty]').hidden = saved.length > 0; }
document.addEventListener('click', event => { const button = event.target.closest('[data-save]'); if (!button) return; const id = button.dataset.save; const saved = getSaved(); setSaved(saved.includes(id) ? saved.filter(item => item !== id) : [...saved, id]); updateSavedCount(); renderFeatured(); renderSaved(); renderExplore(); renderDetail(); });
document.querySelector('[data-newsletter-form]')?.addEventListener('submit', event => { event.preventDefault(); event.target.querySelector('.form-message').textContent = 'You’re on the list—see you next week.'; event.target.reset(); });
updateSavedCount(); renderFeatured(); renderExplore(); renderDetail(); renderSaved();
