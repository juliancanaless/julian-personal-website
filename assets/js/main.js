// Mobile nav toggle (accessible)
const toggle = document.querySelector('.nav-toggle');
const menu = document.querySelector('#nav-menu');
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const open = menu.getAttribute('data-open') === 'true';
    menu.setAttribute('data-open', String(!open));
    toggle.setAttribute('aria-expanded', String(!open));
  });
}

// Contact form (Formspree) progressive enhancement
const form = document.getElementById('contact-form');
const statusEl = document.getElementById('form-status');

if (form && statusEl) {
  form.addEventListener('submit', async (e) => {
    if (window.fetch && window.FormData) {
      e.preventDefault();
      statusEl.textContent = "Sending…";
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn?.setAttribute('disabled', 'true');

      try {
        const data = new FormData(form);
        const res = await fetch(form.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          form.reset();
          statusEl.textContent = "Thanks! Your message was sent.";
        } else {
          const msg = await res.json().catch(() => ({}));
          statusEl.textContent = msg?.errors?.[0]?.message || "Oops — something went wrong. Please try again or email me directly.";
        }
      } catch {
        statusEl.textContent = "Network error. Please try again or email me directly.";
      } finally {
        submitBtn?.removeAttribute('disabled');
      }
    }
    // If no fetch/FormData support, the form submits normally to Formspree.
  });
}

// Experience dropdown toggles
document.querySelectorAll('.exp-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    btn.textContent = expanded ? "Details ▾" : "Hide ▴";

    const body = btn.closest('.exp-item').querySelector('.exp-body');
    body.classList.toggle('open');
  });
});

// Smooth expand/collapse for <details class="exp"> (with WAAPI + fallback)
document.querySelectorAll('details.exp').forEach(exp => {
  const content = exp.querySelector('.exp-content');
  if (!content) return;

  // Respect reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    if (!exp.open) content.style.height = '0px';
    exp.addEventListener('toggle', () => {
      content.style.height = exp.open ? 'auto' : '0px';
    });
    return;
  }

  let anim;
  const timings = {
    open:  { duration: 350, easing: 'cubic-bezier(.22,.61,.36,1)' },
    close: { duration: 420, easing: 'cubic-bezier(.22,.61,.36,1)' }
  };

  // Start collapsed height if closed
  if (!exp.open) content.style.height = '0px';

  exp.addEventListener('toggle', () => {
    const startH = content.getBoundingClientRect().height;

    if (exp.open) {
      // Opening: measure end height
      content.style.height = 'auto';
      const endH = content.getBoundingClientRect().height;
      content.style.height = startH + 'px';

      if (content.animate) {
        anim?.cancel();
        anim = content.animate(
          [{ height: startH + 'px' }, { height: endH + 'px' }],
          timings.open
        );
        anim.onfinish = () => { content.style.height = 'auto'; anim = null; };
        anim.oncancel = () => { anim = null; };
      } else {
        requestAnimationFrame(() => {
          content.style.transition = `height ${timings.open.duration}ms ${timings.open.easing}`;
          content.style.height = endH + 'px';
        });
        content.addEventListener('transitionend', function handler() {
          content.style.transition = ''; content.style.height = 'auto';
          content.removeEventListener('transitionend', handler);
        });
      }

    } else {
      // Closing
      const endH = 0;

      if (content.animate) {
        anim?.cancel();
        anim = content.animate(
          [{ height: startH + 'px' }, { height: endH + 'px' }],
          timings.close
        );
        anim.onfinish = () => { content.style.height = '0px'; anim = null; };
        anim.oncancel = () => { anim = null; };
      } else {
        content.style.height = startH + 'px';
        requestAnimationFrame(() => {
          content.style.transition = `height ${timings.close.duration}ms ${timings.close.easing}`;
          content.style.height = endH + 'px';
        });
        content.addEventListener('transitionend', function handler() {
          content.style.transition = ''; content.style.height = '0px';
          content.removeEventListener('transitionend', handler);
        });
      }
    }
  });
});

(function(){
  const cards = Array.from(document.querySelectorAll('details.proj'));
  if (!cards.length) return;

  const mqDesktop = window.matchMedia('(min-width: 920px)');
  const modal = document.getElementById('proj-modal');
  const modalTitle = document.getElementById('proj-modal-title');
  const modalMotive = document.getElementById('proj-modal-motive');
  const modalMedia = document.getElementById('proj-modal-media');
  const modalBody  = document.getElementById('proj-modal-body');
  const modalGit   = document.getElementById('proj-modal-gh');

  function openModalFrom(card){
    const title = card.dataset.title || card.querySelector('.proj-title')?.textContent || 'Project';
    const motive = card.querySelector('.proj-motive')?.textContent || '';
    const cover = card.querySelector('.proj-cover img');
    const gh = card.querySelector('.proj-cover')?.getAttribute('href') || '#';

    modalTitle.textContent = title;
    modalMotive.textContent = motive;
    modalGit.href = gh;

    // media
    modalMedia.innerHTML = '';
    if (cover) {
      const img = document.createElement('img');
      img.src = cover.getAttribute('src');
      img.alt = cover.getAttribute('alt') || title;
      modalMedia.appendChild(img);
    }

    // body sections (clone)
    modalBody.innerHTML = '';
    const sections = card.querySelector('.proj-sections');
    if (sections) {
      modalBody.appendChild(sections.cloneNode(true));
    }

    modal.removeAttribute('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(){
    modal.setAttribute('hidden', '');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Close interactions
  modal?.addEventListener('click', (e) => {
    if (e.target.matches('[data-close-modal], .proj-modal__backdrop')) closeModal();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hasAttribute('hidden')) closeModal();
  });

  // Mobile accordion: one open at a time
  function setupMobileAccordion(){
    cards.forEach(card => {
      const content = card.querySelector('.proj-content');
      if (!content) return;
      // Initialize collapsed
      if (!card.open) content.style.height = '0px';

      card.addEventListener('toggle', () => {
        // close siblings when opening
        if (card.open) {
          cards.forEach(other => {
            if (other !== card && other.open) {
              other.open = false;
              const oc = other.querySelector('.proj-content');
              if (oc) oc.style.height = '0px';
            }
          });
          // expand this
          content.style.height = 'auto';
          const end = content.scrollHeight + 'px';
          content.style.height = '0px';
          requestAnimationFrame(() => {
            content.style.transition = 'height 320ms cubic-bezier(.22,.61,.36,1)';
            content.style.height = end;
          });
          content.addEventListener('transitionend', function h(){
            content.style.transition = ''; content.style.height = 'auto';
            content.removeEventListener('transitionend', h);
          });
        } else {
          const start = content.scrollHeight + 'px';
          content.style.height = start;
          requestAnimationFrame(() => {
            content.style.transition = 'height 380ms cubic-bezier(.22,.61,.36,1)';
            content.style.height = '0px';
          });
          content.addEventListener('transitionend', function h(){
            content.style.transition = ''; content.style.height = '0px';
            content.removeEventListener('transitionend', h);
          });
        }
      });
    });
  }

  // Desktop modal behavior: intercept summary clicks (but not image link)
  function setupDesktopModal(){
    // Ensure all details are closed visually
    cards.forEach(c => {
      c.open = false;
      const content = c.querySelector('.proj-content');
      if (content) content.style.height = ''; // reset
    });

    document.addEventListener('click', (e) => {
      const summary = e.target.closest('.proj-summary');
      if (!summary) return;
      const card = summary.closest('details.proj');
      if (!card) return;

      // If the click is on the cover <a>, let it go to GitHub
      if (e.target.closest('.proj-cover')) return;

      // Otherwise, prevent details toggle and open modal
      e.preventDefault();
      e.stopPropagation();
      openModalFrom(card);
    });
  }

  // Switch modes on load & when viewport changes
  function applyMode(e){
    if (mqDesktop.matches) {
      setupDesktopModal();
    } else {
      setupMobileAccordion();
    }
  }
  applyMode();
  mqDesktop.addEventListener('change', applyMode);
})();



// Footer year
document.getElementById('year')?.append(new Date().getFullYear());
