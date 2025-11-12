document.addEventListener('DOMContentLoaded', () => {
  const q = sel => document.querySelector(sel);
  const qa = sel => Array.from(document.querySelectorAll(sel));

  const navButtons = qa('.nav-btn');
  const pages = qa('.page');

  function showPage(name, push = true) {
    pages.forEach(p => p.classList.toggle('active', p.id === name));
    navButtons.forEach(b => b.classList.toggle('active', b.dataset.route === name));
    if (push) history.pushState({ route: name }, '', `#${name}`);
    const active = document.getElementById(name);
    if (active) active.focus({ preventScroll: false });
  }

  navButtons.forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.route)));

  window.addEventListener('popstate', (ev) => {
    const route = (ev.state && ev.state.route) || location.hash.replace('#', '') || 'home';
    showPage(route, false);
  });

  const initialRoute = location.hash.replace('#', '') || 'home';
  history.replaceState({ route: initialRoute }, '', `#${initialRoute}`);
  showPage(initialRoute, false);

  const bgVideo = q('#bgVideo');
  const soundBtn = q('#soundToggle');
  const SOUND_KEY = 'ch_sound_muted_v1';

  function updateSoundUI(isMuted) {
    if (!soundBtn) return;
    // pressed = sound ON. So if isMuted === true -> aria-pressed = "false"
    soundBtn.textContent = isMuted ? '🔇' : '🔊';
    soundBtn.setAttribute('aria-pressed', String(!isMuted));
    soundBtn.setAttribute('aria-label', isMuted ? 'Sound off' : 'Sound on');
  }

  if (bgVideo) {
    bgVideo.playsInline = true;
    bgVideo.setAttribute('playsinline', '');
    // read saved preference (string 'true' means muted)
    const savedSound = localStorage.getItem(SOUND_KEY);
    const preferMuted = savedSound === null ? true : (savedSound === 'true');

    // enforce muted on load unless user explicitly set false
    bgVideo.muted = Boolean(preferMuted);
    updateSoundUI(bgVideo.muted);

    async function attemptPlay() {
      try { await bgVideo.play(); }
      catch (err) { console.debug('Autoplay retry pending:', err); }
    }

    // try to play on load (muted preferred improves autoplay success)
    attemptPlay();

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') attemptPlay();
    });

    function oneTimeGestureRetry() {
      attemptPlay();
      window.removeEventListener('touchstart', oneTimeGestureRetry);
      window.removeEventListener('pointerdown', oneTimeGestureRetry);
    }
    window.addEventListener('touchstart', oneTimeGestureRetry, { passive: true });
    window.addEventListener('pointerdown', oneTimeGestureRetry, { passive: true });

    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        // toggle: if currently muted -> unmute; else mute
        const nowMuted = !bgVideo.muted;
        // If unmuting, set muted=false only after a user gesture; it's already a click so ok.
        bgVideo.muted = nowMuted;
        updateSoundUI(nowMuted);
        localStorage.setItem(SOUND_KEY, String(nowMuted));
        // attempt to play in case browser paused when muted=false
        if (!nowMuted) attemptPlay().catch(() => {});
      });
    }
  }

  function safeParseJSON(json, fallback) {
    try { return JSON.parse(json); } catch { return fallback; }
  }

  function loadJSON(key, fallback = []) {
    return safeParseJSON(localStorage.getItem(key), fallback);
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    return re.test(String(email).toLowerCase());
  }

  const SUB_KEY = 'ch_subscribers_v1';
  const CONTACT_KEY = 'ch_contacts_v1';

  const subscribeForm = q('#subscribeForm');
  const subscribeEmail = q('#subscribeEmail');
  const subscribeMsg = q('#subscribeMsg');

  if (subscribeForm) {
    subscribeForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const emailRaw = (subscribeEmail.value || '').trim();
      const email = emailRaw.toLowerCase();
      if (!email || !isValidEmail(email)) {
        subscribeMsg.textContent = 'Please enter a valid email address.';
        subscribeMsg.style.color = '#ff9b9b';
        subscribeEmail.focus();
        return;
      }
      const subs = loadJSON(SUB_KEY, []);
      if (subs.includes(email)) {
        subscribeMsg.textContent = 'You are already subscribed.';
        subscribeMsg.style.color = '#ffd39b';
        // ensure focusable and focus
        subscribeMsg.setAttribute('tabindex', '-1');
        subscribeMsg.focus();
        return;
      }
      subs.push(email);
      saveJSON(SUB_KEY, subs);
      subscribeMsg.textContent = "Thanks — we'll notify you!";
      subscribeMsg.style.color = '#bfffe6';
      subscribeForm.reset();
      subscribeMsg.setAttribute('tabindex', '-1');
      subscribeMsg.focus();
    });
  }

  const contactForm = q('#contactForm');
  const contactName = q('#contactName');
  const contactEmail = q('#contactEmail');
  const contactMessage = q('#contactMessage');
  const contactMsg = q('#contactMsg');

  if (contactForm) {
    contactForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = (contactName.value || '').trim();
      const email = (contactEmail.value || '').trim().toLowerCase();
      const message = (contactMessage.value || '').trim();
      if (!email || !isValidEmail(email)) {
        contactMsg.textContent = 'Please provide a valid email address.';
        contactMsg.style.color = '#ff9b9b';
        contactEmail.focus();
        return;
      }
      if (!message || message.length < 5) {
        contactMsg.textContent = 'Please write a short message (at least 5 characters).';
        contactMsg.style.color = '#ff9b9b';
        contactMessage.focus();
        return;
      }
      const contacts = loadJSON(CONTACT_KEY, []);
      contacts.push({ name, email, message, date: new Date().toISOString() });
      saveJSON(CONTACT_KEY, contacts);
      contactMsg.textContent = 'Thanks — your message has been sent (saved locally).';
      contactMsg.style.color = '#bfffe6';
      contactForm.reset();
      contactMsg.setAttribute('tabindex', '-1');
      contactMsg.focus();
    });
  }

  const shareBtn = q('#shareBtn');
  const copyLinkBtn = q('#copyLink');
  const pageUrl = location.href;

  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: document.title,
            text: 'Champaran चलचित्र — launching soon',
            url: pageUrl
          });
        } catch {}
      } else {
        // inline fallback
        const fallbackNotice = document.createElement('div');
        fallbackNotice.className = 'share-fallback';
        fallbackNotice.textContent = 'Share is not supported on this device — try copying the link.';
        document.body.appendChild(fallbackNotice);
        setTimeout(() => fallbackNotice.remove(), 2200);
      }
    });
  }

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pageUrl);
        const original = copyLinkBtn.textContent;
        copyLinkBtn.textContent = 'Link copied!';
        setTimeout(() => { copyLinkBtn.textContent = original; }, 1800);
      } catch {
        alert('Copy failed. You can copy the URL from the address bar.');
      }
    });
  }

  const yearEl = q('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('reduced-motion');
  }

  const openTrailer = q('#openTrailer');
  const trailerModal = q('#trailerModal');
  const modalVideo = q('#modalVideo');
  const closeTrailer = q('#closeTrailer');
  const gotoAbout = q('#gotoAbout');
  const mainContent = q('main');

  function openModal() {
    if (!trailerModal) return;
    trailerModal.setAttribute('aria-hidden', 'false');
    // hide main content for screen readers
    if (mainContent) mainContent.setAttribute('aria-hidden', 'true');
    if (bgVideo && !bgVideo.paused) bgVideo.pause();
    try {
      modalVideo.currentTime = 0;
      modalVideo.play().catch(() => {});
    } catch {}
    closeTrailer && closeTrailer.focus();
  }

  function closeModal() {
    if (!trailerModal) return;
    trailerModal.setAttribute('aria-hidden', 'true');
    if (mainContent) mainContent.removeAttribute('aria-hidden');
    if (modalVideo && !modalVideo.paused) modalVideo.pause();
    if (bgVideo && bgVideo.paused) bgVideo.play().catch(() => {});
    openTrailer && openTrailer.focus();
  }

  openTrailer && openTrailer.addEventListener('click', openModal);
  closeTrailer && closeTrailer.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && trailerModal && trailerModal.getAttribute('aria-hidden') === 'false') closeModal();
  });

  trailerModal && trailerModal.addEventListener('click', (ev) => { if (ev.target === trailerModal) closeModal(); });

  const quickForm = q('#quickSubscribe');
  const quickEmail = q('#quickEmail');
  if (quickForm) {
    quickForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const emailRaw = (quickEmail.value || '').trim();
      const email = emailRaw.toLowerCase();
      if (!email || !isValidEmail(email)) {
        quickEmail.focus();
        quickEmail.style.boxShadow = '0 0 0 3px rgba(255,100,100,0.12)';
        setTimeout(() => quickEmail.style.boxShadow = '', 1500);
        return;
      }
      const subs = JSON.parse(localStorage.getItem(SUB_KEY) || '[]');
      if (!subs.includes(email)) {
        subs.push(email);
        localStorage.setItem(SUB_KEY, JSON.stringify(subs));
      }
      quickEmail.value = '';
      quickEmail.placeholder = 'Thanks — saved!';
      setTimeout(() => quickEmail.placeholder = 'you@example.com', 1600);
    });
  }

  if (gotoAbout) {
    gotoAbout.addEventListener('click', () => { document.querySelector('.nav-btn[data-route="about"]')?.click(); });
    gotoAbout.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.querySelector('.nav-btn[data-route="about"]')?.click(); } });
  }

  const copySmall = q('#copyLinkSmall');
  copySmall && copySmall.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      const original = copySmall.textContent;
      copySmall.textContent = 'Copied!';
      setTimeout(() => copySmall.textContent = original, 1400);
    } catch {
      alert('Copy not available');
    }
  });
});
