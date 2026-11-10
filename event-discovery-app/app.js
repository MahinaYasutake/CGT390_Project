// Demo events recur from the next Friday so their displayed dates stay useful.
const nextFriday = new Date();
nextFriday.setUTCHours(12, 0, 0, 0);
nextFriday.setUTCDate(nextFriday.getUTCDate() + ((5 - nextFriday.getUTCDay() + 6) % 7) + 1);
function eventDate(offset, time) {
  const day = new Date(nextFriday);
  day.setUTCDate(day.getUTCDate() + offset);
  return {
    dateISO: day.toISOString().slice(0, 10),
    date: `${new Intl.DateTimeFormat('en-US', {weekday:'short', month:'short', day:'numeric', year:'numeric', timeZone:'UTC'}).format(day)} · ${time}`
  };
}
const events = [
  {id:'night-market',title:'Night Market & Tiny Concerts',...eventDate(0,'6:30 PM'),capacity:24,location:'Riverside Warehouse',category:'Community',color:'coral',tag:'FOOD · MUSIC',description:'An evening of local makers, warm food, and three tiny concerts tucked into a neighborhood warehouse. Come curious, leave connected.',organizer:'Riverside Neighbors',price:'Pay what you can',duration:'3 hours',audience:'All ages',materials:'Not needed',attendance:'Registration available in this demo'},
  {id:'clay-club',title:'Clay Club: Make a Useful Thing',...eventDate(1,'10:00 AM'),capacity:8,location:'Morrow Art House',category:'Creative',color:'yellow',tag:'HANDS-ON',description:'A relaxed morning learning the basics of hand-building clay. You’ll leave with one useful, slightly wonky object and a new creative habit.',organizer:'Morrow Art House',price:'$18',duration:'2 hours',audience:'Beginner friendly',materials:'Included',attendance:'Registration available in this demo'},
  {id:'slow-sunday',title:'Slow Sunday: Stretch & Reset',...eventDate(2,'9:00 AM'),capacity:16,location:'Juniper Park',category:'Wellness',color:'blue',tag:'OUTDOORS',description:'Start the week gently with an all-levels stretch, a short guided walk, and a quiet cup of tea among good company.',organizer:'Open Pace Collective',price:'$10',duration:'90 minutes',audience:'All levels',materials:'Bring a mat',attendance:'Registration available in this demo'},
  {id:'future-hours',title:'Office Hours for the Future',...eventDate(4,'7:00 PM'),capacity:30,location:'Online · Gatherly Rooms',category:'Online',color:'lavender',tag:'CONVERSATION',description:'A generous, low-pressure conversation about building a more humane relationship with technology and work.',organizer:'Common Thread Studio',price:'Free',duration:'1 hour',audience:'Open conversation',materials:'A device with audio',attendance:'Registration available in this demo'},
  {id:'field-notes',title:'Field Notes: A City Walk',...eventDate(5,'5:45 PM'),capacity:12,location:'Meet at Bellweather Library',category:'Community',color:'blue',tag:'WALKING',description:'Notice the overlooked details of your own block on a guided walk with a photographer and a handful of friendly strangers.',organizer:'Bellweather Library',price:'Free',duration:'2 hours',audience:'All walking levels',materials:'Comfortable shoes',attendance:'Registration available in this demo'},
  {id:'poster-lab',title:'Poster Lab for Beginners',...eventDate(6,'6:00 PM'),capacity:10,location:'The Print Pantry',category:'Creative',color:'yellow',tag:'DESIGN',description:'Make a bold one-color poster using paper, ink, and a few simple composition tricks. No design experience required.',organizer:'The Print Pantry',price:'$22',duration:'2 hours',audience:'Beginner friendly',materials:'Included',attendance:'Registration available in this demo'}
];

const savedKey = 'gatherly-saved-events';
const eventById = id => events.find(event => event.id === id);
const validEventId = id => typeof id === 'string' && Boolean(eventById(id));
let currentAccount = null;
let accountSavedIds = [];

function getSaved() {
  if (currentAccount) return accountSavedIds;
  // Browser storage is untrusted. Read safely without overwriting damaged data.
  try {
    const ids = JSON.parse(localStorage.getItem(savedKey) || '[]');
    return Array.isArray(ids) ? [...new Set(ids.filter(validEventId))] : [];
  } catch {
    return [];
  }
}
const isSaved = id => getSaved().includes(id);

function setSaved(ids) {
  if (!Array.isArray(ids) || !ids.every(validEventId)) {
    return {ok: false, error: 'Invalid saved event list.'};
  }
  const uniqueIds = [...new Set(ids)];
  try {
    localStorage.setItem(savedKey, JSON.stringify(uniqueIds));
    return {ok: true, ids: uniqueIds};
  } catch {
    return {ok: false, error: 'Could not update saved events. Browser storage may be full or unavailable. Try again.'};
  }
}

function toggleSaved(id) {
  if (!validEventId(id)) return {ok: false, error: 'This event is not available to save.'};
  const saved = getSaved();
  const wasSaved = saved.includes(id);
  if (currentAccount) {
    const ids = wasSaved ? saved.filter(item => item !== id) : [...saved, id];
    return fetch('/api/me/saved', {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ids})})
      .then(async response => {
        const data = await response.json();
        if (!response.ok) return {ok:false, error:data.error || 'Could not update saved events.'};
        accountSavedIds = data.ids;
        return {ok:true, id, saved:!wasSaved};
      }).catch(() => ({ok:false, error:'Could not reach your account shortlist.'}));
  }
  const result = setSaved(wasSaved ? saved.filter(item => item !== id) : [...saved, id]);
  return result.ok ? {...result, id, saved: !wasSaved} : result;
}

function announceSave(message) {
  let status = document.querySelector('[data-save-status]');
  if (!status) {
    status = document.createElement('p');
    status.dataset.saveStatus = '';
    status.className = 'save-note';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    document.querySelector('main').append(status);
  }
  status.textContent = message;
}
const trackGAEvent = (name, params = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
};

function eventCard(event) {
  const saved = isSaved(event.id);
  return `<article class="event-card"><a href="event.html?id=${event.id}" class="event-image ${event.color}" aria-label="View details for ${event.title}"><span>${event.date.split(' · ')[0]}</span><span>${event.category} · ${event.tag}</span></a><div class="event-info"><p class="category">${event.category}</p><h3><a href="event.html?id=${event.id}">${event.title}</a></h3><p class="event-meta"><strong>${event.date.split(' · ')[1]}</strong></p><p class="event-meta">${event.location}</p><div class="card-footer"><span class="muted">${event.price}</span><button class="save-button ${saved ? 'saved' : ''}" data-save="${event.id}" aria-label="${saved ? 'Remove' : 'Save'} ${event.title}" aria-pressed="${saved}">${saved ? '♥ Saved' : '♡ Save'}</button></div></div></article>`;
}

function updateSavedCount() { document.querySelectorAll('.saved-count').forEach(node => node.textContent = getSaved().length); }
function renderFeatured() { const target = document.querySelector('[data-featured-events]'); if (target) target.innerHTML = events.slice(0, 3).map(eventCard).join(''); }
let refreshExplore;
function renderExplore() {
  const list = document.querySelector('[data-event-list]'); if (!list) return;
  if (refreshExplore) { refreshExplore(); return; }
  let filters = {category:'All', date:'All', location:'All', price:'All'}; let query = '';
  const isWeekend = event => [0, 5, 6].includes(new Date(`${event.dateISO}T12:00:00`).getDay());
  const isThisWeek = event => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(today); end.setDate(today.getDate() + (7 - (today.getDay() || 7))); end.setHours(23, 59, 59, 999);
    const day = new Date(`${event.dateISO}T12:00:00`);
    return day >= today && day <= end;
  };
  const draw = () => {
    const filtered = events.filter(event => {
      const matchesCategory = filters.category === 'All' || event.category === filters.category;
      const matchesDate = filters.date === 'All' || (filters.date === 'This week' && isThisWeek(event)) || (filters.date === 'Weekend' && isWeekend(event));
      const isOnline = event.location.startsWith('Online');
      const matchesLocation = filters.location === 'All' || (filters.location === 'Online' && isOnline) || (filters.location === 'Local' && !isOnline);
      const matchesPrice = filters.price === 'All' || (filters.price === 'Free' && event.price === 'Free') || (filters.price === 'Paid' && event.price !== 'Free');
      const matchesQuery = `${event.title} ${event.location} ${event.category}`.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesDate && matchesLocation && matchesPrice && matchesQuery;
    });
    list.innerHTML = filtered.map(eventCard).join(''); document.querySelector('[data-results-count]').textContent = `${filtered.length} event${filtered.length === 1 ? '' : 's'} shown`; document.querySelector('[data-empty-state]').hidden = filtered.length > 0;
  };
  document.querySelector('[data-search]').addEventListener('input', e => { query = e.target.value; draw(); });
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter; filters[filter] = button.dataset.value;
    document.querySelectorAll(`[data-filter="${filter}"]`).forEach(item => { item.classList.remove('active'); item.setAttribute('aria-pressed','false'); }); button.classList.add('active'); button.setAttribute('aria-pressed','true'); draw();
  }));
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item.classList.contains('active'))));
  draw();
  refreshExplore = draw;
  document.querySelector('[data-reset-filters]').addEventListener('click', () => {
    filters = {category:'All', date:'All', location:'All', price:'All'}; query = '';
    document.querySelector('[data-search]').value = '';
    document.querySelectorAll('[data-filter]').forEach(item => { const active = item.dataset.value === 'All'; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
    draw();
  });
}
function renderDetail() {
  const target = document.querySelector('[data-event-detail]'); if (!target) return;
  const event = eventById(new URLSearchParams(location.search).get('id'));
  if (!event) {
    document.title = 'Event not found | Gatherly';
    target.innerHTML = '<h1>Event not found</h1><p>This event is unavailable. <a href="explore.html">Back to explore</a></p>';
    return;
  }
  document.title = `${event.title} | Gatherly`;
  const saved = isSaved(event.id);
  target.innerHTML = `<a class="detail-back" href="explore.html">← Back to explore</a><div class="detail-layout"><div class="detail-image ${event.color}"><span>${event.category} · ${event.tag}</span><strong>${event.title.split(':')[0]}</strong></div><div class="detail-copy"><p class="eyebrow">${event.category}</p><h1>${event.title}</h1><p>${event.description}</p><div class="detail-facts"><p class="detail-fact"><strong>When</strong><span>${event.date}</span></p><p class="detail-fact"><strong>Where</strong><span>${event.location}</span></p><p class="detail-fact"><strong>Hosted by</strong><span>${event.organizer}</span></p></div><section class="before-you-go" aria-labelledby="before-you-go-title"><p class="eyebrow" id="before-you-go-title">Before you go</p><div class="practical-grid"><p><strong>Duration</strong><span>${event.duration}</span></p><p><strong>Good for</strong><span>${event.audience}</span></p><p><strong>Materials</strong><span>${event.materials}</span></p><p><strong>Attendance</strong><span>${event.attendance}</span></p></div></section><div class="detail-actions"><button class="button" data-save="${event.id}" aria-describedby="save-note" aria-pressed="${saved}">${saved ? '♥ Saved' : '♡ Save event'}</button><span class="muted">${event.price}</span></div><p class="save-note" id="save-note" role="status" aria-live="polite">Save this event to your shortlist. Saving does not reserve a spot.</p></div></div>`;
  const panel = document.createElement('section');
  panel.className = 'registration-panel';
  panel.innerHTML = `<h2>Reserve a spot</h2><p data-availability role="status">Checking availability…</p><p class="registration-note">Local demo only. Sign in with a fictional account, then use a fictional name. No payment or email will be sent.</p><p data-signin-note hidden><a href="account.html">Sign in or create an account</a> to reserve a spot.</p><form data-registration-form hidden><label>Fictional name<input name="name" type="text" minlength="2" maxlength="80" autocomplete="off" required></label><button class="button" type="submit">Reserve spot</button></form><p data-registration-message role="status" aria-live="polite"></p><div data-registration-confirmation hidden><p>Your spot is reserved in your demo account.</p><button type="button" class="cancel-registration" data-cancel-registration>Cancel reservation</button></div>`;
  target.querySelector('.detail-copy').append(panel);
  initRegistration(event, panel);
}
function initRegistration(event, panel) {
  const form = panel.querySelector('[data-registration-form]');
  const availability = panel.querySelector('[data-availability]');
  const message = panel.querySelector('[data-registration-message]');
  const confirmation = panel.querySelector('[data-registration-confirmation]');
  const signInNote = panel.querySelector('[data-signin-note]');
  let registration = null;
  async function refreshRegistration() {
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(event.id)}/availability`);
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json();
      availability.textContent = `${data.remaining} of ${data.capacity} spots left`;
      const mine = await fetch('/api/me/registrations');
      if (mine.status === 401) {
        form.hidden = true; confirmation.hidden = true; signInNote.hidden = false;
        return;
      }
      if (!mine.ok) throw new Error('Unavailable');
      const body = await mine.json();
      registration = body.data.find(item => item.eventId === event.id && item.date === event.dateISO) || null;
      signInNote.hidden = true;
      confirmation.hidden = !registration;
      form.hidden = Boolean(registration) || data.remaining === 0;
      if (!registration && data.remaining === 0) message.textContent = 'This event is full.';
    } catch {
      availability.textContent = 'Reservations are available in the Gatherly demo only.';
      form.hidden = true; confirmation.hidden = true;
    }
  }
  form.addEventListener('submit', async submitEvent => {
    submitEvent.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    message.textContent = 'Reserving your demo spot…';
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({eventId: event.id, name: form.elements.name.value})
      });
      const data = await response.json();
      if (!response.ok) { message.textContent = data.error || 'Could not reserve a spot.'; await refreshRegistration(); return; }
      message.textContent = data.message;
      form.reset();
      await refreshRegistration();
    } catch { message.textContent = 'Could not reach the registration service. Nothing was reserved.'; }
    finally { button.disabled = false; }
  });
  panel.querySelector('[data-cancel-registration]').addEventListener('click', async cancelEvent => {
    if (!registration) return;
    const button = cancelEvent.currentTarget;
    button.disabled = true;
    try {
      const response = await fetch(`/api/registrations/${registration.id}`, {method:'DELETE'});
      const data = await response.json();
      if (!response.ok) { message.textContent = data.error || 'Could not cancel this reservation.'; return; }
      message.textContent = data.message;
      await refreshRegistration();
    } catch { message.textContent = 'Could not reach the registration service.'; }
    finally { button.disabled = false; }
  });
  refreshRegistration();
}
function renderSaved() { const target = document.querySelector('[data-saved-events]'); if (!target) return; const saved = events.filter(event => getSaved().includes(event.id)); target.innerHTML = saved.map(eventCard).join(''); document.querySelector('[data-saved-empty]').hidden = saved.length > 0; }
async function renderReservations() {
  const target = document.querySelector('[data-reserved-events]'); if (!target) return;
  const empty = document.querySelector('[data-reserved-empty]');
  try {
    const response = await fetch('/api/me/registrations');
    if (response.status === 401) {
      target.innerHTML = '';
      empty.hidden = false;
      empty.innerHTML = 'Sign in on the <a href="account.html">Account page</a> to see your reservations.';
      return;
    }
    if (!response.ok) throw new Error('Unavailable');
    const body = await response.json();
    const reserved = events.filter(event => body.data.some(item => item.eventId === event.id && item.date === event.dateISO));
    target.innerHTML = reserved.map(event => `<article class="reservation-card"><p class="category">Spot reserved</p><h3><a href="event.html?id=${event.id}">${event.title}</a></h3><p>${event.date}</p><p>${event.location}</p><a class="text-link" href="event.html?id=${event.id}">View or cancel reservation →</a></article>`).join('');
    empty.hidden = reserved.length > 0;
    empty.textContent = 'No spots reserved in this account yet.';
  } catch {
    target.innerHTML = '';
    empty.hidden = false;
    empty.textContent = 'Reservations are available in the Gatherly demo only.';
  }
}
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-save]'); if (!button) return;
  button.disabled = true;
  const result = await toggleSaved(button.dataset.save);
  button.disabled = false;
  if (!result.ok) {
    announceSave(result.error);
    return;
  }
  const selectedEvent = eventById(result.id);
  updateSavedCount(); renderFeatured(); renderSaved(); renderExplore(); renderDetail();
  announceSave(result.saved ? 'Event saved. Saving does not reserve a spot.' : 'Event removed from your saved list.');
  trackGAEvent(result.saved ? 'event_saved' : 'event_unsaved', {
    event_id: result.id,
    event_title: selectedEvent.title,
    event_category: selectedEvent.category
  });
});
document.querySelector('[data-newsletter-form]')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const message = form.querySelector('.form-message');
  button.disabled = true;
  message.textContent = 'Saving demo signup…';
  try {
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: form.elements.email.value})
    });
    const result = await response.json();
    if (!response.ok) {
      message.textContent = result.error || 'Could not save this demo signup.';
      return;
    }
    message.textContent = result.message;
    form.reset();
  } catch {
    message.textContent = 'Signup is available in the demo only. Nothing was saved.';
  } finally {
    button.disabled = false;
  }
});
function renderAccountPage(serviceAvailable = true) {
  const page = document.querySelector('[data-account-page]'); if (!page) return;
  page.querySelector('[data-auth-guest]').hidden = Boolean(currentAccount) || !serviceAvailable;
  page.querySelector('[data-auth-user]').hidden = !currentAccount;
  page.querySelector('[data-auth-unavailable]').hidden = serviceAvailable;
  if (currentAccount) page.querySelector('[data-account-email]').textContent = currentAccount.email;
}
async function loadAccount() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) throw new Error('Unavailable');
    const body = await response.json();
    currentAccount = body.account;
    accountSavedIds = [];
    if (currentAccount) {
      const savedResponse = await fetch('/api/me/saved');
      if (!savedResponse.ok) throw new Error('Unavailable');
      accountSavedIds = (await savedResponse.json()).ids.filter(validEventId);
    }
    renderAccountPage();
  } catch {
    currentAccount = null;
    accountSavedIds = [];
    renderAccountPage(false);
  }
  updateSavedCount(); renderFeatured(); renderExplore(); renderDetail(); renderSaved(); renderReservations();
}
document.querySelectorAll('[data-auth-form]').forEach(form => form.addEventListener('submit', async event => {
  event.preventDefault();
  const status = document.querySelector('[data-auth-status]');
  const button = form.querySelector('button[type="submit"]');
  if (form.dataset.authForm === 'signup' && form.elements.password.value !== form.elements.confirmPassword.value) {
    status.textContent = 'The two passwords do not match.';
    return;
  }
  button.disabled = true;
  status.textContent = 'Checking your demo account…';
  try {
    const response = await fetch(`/api/auth/${form.dataset.authForm}`, {method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:form.elements.email.value, password:form.elements.password.value})});
    const body = await response.json();
    if (!response.ok) {status.textContent = body.error || 'Could not sign in.'; return;}
    form.reset();
    form.querySelectorAll('[data-password-input]').forEach(input => {input.type = 'password';});
    await loadAccount();
    status.textContent = form.dataset.authForm === 'signup' ? 'Demo account created. You are signed in.' : 'Signed in to your demo account.';
  } catch { status.textContent = 'Accounts are available in the Gatherly demo only.'; }
  finally {button.disabled = false;}
}));
document.querySelectorAll('[data-show-password]').forEach(toggle => toggle.addEventListener('change', event => {
  event.currentTarget.closest('form').querySelectorAll('[data-password-input]').forEach(input => {
    input.type = event.currentTarget.checked ? 'text' : 'password';
  });
}));
document.querySelector('[data-signout]')?.addEventListener('click', async () => {
  const status = document.querySelector('[data-auth-status]');
  try {
    const response = await fetch('/api/auth/logout', {method:'POST'});
    if (!response.ok) throw new Error('Unavailable');
    await loadAccount();
    status.textContent = 'Signed out.';
  } catch { status.textContent = 'Could not sign out from the demo.'; }
});
updateSavedCount(); renderFeatured(); renderExplore(); renderDetail(); renderSaved(); renderReservations(); loadAccount();
