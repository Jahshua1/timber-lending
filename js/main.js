// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const siteNav = document.getElementById('site-nav');

navToggle.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

siteNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Scroll reveal
const revealTargets = document.querySelectorAll(
  '.spec-card, .program-card, .closing-card, .team-card, .timeline-stop, .faq-item'
);
revealTargets.forEach((el) => el.classList.add('reveal'));

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => observer.observe(el));
}

// Contact form submission via Web3Forms
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
const formLoadedAt = document.getElementById('form_loaded_at');
if (formLoadedAt) formLoadedAt.value = String(Date.now());

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (form.botcheck.checked) return; // spam honeypot

  // Reject submissions completed implausibly fast (bots filling forms instantly)
  const loadedAt = Number(formLoadedAt.value);
  if (loadedAt && Date.now() - loadedAt < 3000) {
    status.textContent = "Thanks — we'll be in touch within one business day.";
    status.className = 'form-status success';
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  status.textContent = 'Sending…';
  status.className = 'form-status';

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form),
    });
    const result = await response.json();

    if (response.status === 200 && result.success) {
      status.textContent = "Thanks — we'll be in touch within one business day.";
      status.className = 'form-status success';
      form.reset();
    } else {
      throw new Error(result.message || 'Submission failed');
    }
  } catch (err) {
    status.textContent = 'Something went wrong. Please call 919-395-2411 or try again.';
    status.className = 'form-status error';
  } finally {
    submitBtn.disabled = false;
  }
});
