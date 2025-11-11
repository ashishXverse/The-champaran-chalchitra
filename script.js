// SPA routing, continuous bg video control, mute/unmute + form handling
document.addEventListener('DOMContentLoaded', () => {
  // routing
  const navButtons = document.querySelectorAll('.nav-btn');
  const pages = document.querySelectorAll('.page');

  function showPage(name, push = true) {
    pages.forEach(p => p.classList.toggle('active', p.id === name));
    navButtons.forEach(b => b.classList.toggle('active', b.dataset.route === name));
    if (push) history.pushState({ route: name }, '', `#${name}`);
    const active = document.getElementById(name);
    if (active) active.focus();
  }

  navButtons.forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.route)));

  window.addEventListener('popstate', (ev) => {
    const route = (ev.state && ev.state.route) || location.hash.replace('#','') || 'home';
    showPage(route, false);
  });

  const initialRoute = location.hash.replace('#','') || 'home';
  history.replaceState({ route: initialRoute }, '', `#${initialRoute}`);
  showPage(initialRoute, false);

  // background video autoplay + mute toggle
  const bgVideo = document.getElementById('bgVideo');
  const soundBtn = document.getElementById('soundToggle');

  if (bgVideo) {
    // ensure it's muted initially to allow autoplay on most browsers
    bgVideo.muted = true;
    bgVideo.play().catch(err => {
      console.warn('Autoplay blocked or play failed:', err);
    });
  }

  if (soundBtn && bgVideo) {
    soundBtn.addEventListener('click', () => {
      if (bgVideo.muted) {
        bgVideo.muted = false;
        soundBtn.textContent = '🔊';
        soundBtn.setAttribute('aria-label', 'Sound on');
      } else {
        bgVideo.muted = true;
        soundBtn.textContent = '🔇';
        soundBtn.setAttribute('aria-label', 'Sound off');
      }
    });
  }

  // notify form
  const notifyForm = document.getElementById('notifyForm');
  const emailInput = document.getElementById('email');
  const formMsg = document.getElementById('formMsg');

  if (notifyForm) {
    notifyForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const email = (emailInput && emailInput.value || '').trim();
      if (!email || !email.includes('@')) {
        formMsg.textContent = 'Please enter a valid email address.';
        formMsg.style.color = '#ff9b9b';
        return;
      }
      // TODO: integrate with backend / service
      formMsg.textContent = "Thanks — we'll notify you!";
      formMsg.style.color = '#bfffe6';
      notifyForm.reset();
    });
  }
});
