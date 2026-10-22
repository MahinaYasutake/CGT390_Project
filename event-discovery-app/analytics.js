// Keep the local queue ready; download Google Analytics only after interaction.
(() => {
  const measurementId = 'G-TR75TSZ8BT';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  let started = false;
  function loadAnalytics() {
    if (started) return;
    started = true;
    window.removeEventListener('pointerdown', loadAnalytics);
    window.removeEventListener('keydown', loadAnalytics);
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(script);
  }
  window.addEventListener('pointerdown', loadAnalytics, {passive: true});
  window.addEventListener('keydown', loadAnalytics);
})();
