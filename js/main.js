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

// Application modal — open/close
const applyOverlay = document.getElementById('applyModalOverlay');
const applyModalBox = document.getElementById('applyModalBox');
const applyModalCloseBtn = document.getElementById('applyModalCloseBtn');

function openApplyModal(event) {
  if (event) event.preventDefault();
  applyOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (formLoadedAt) formLoadedAt.value = String(Date.now());
  wizardCurrentStep = 1;
  updateWizardUI();
  const firstField = wizardSteps[0].querySelector('input, select, textarea');
  if (firstField) firstField.focus();
}

function closeApplyModal() {
  applyOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.js-apply-trigger').forEach((el) => {
  el.addEventListener('click', openApplyModal);
});
applyModalCloseBtn.addEventListener('click', closeApplyModal);
applyOverlay.addEventListener('click', (event) => {
  if (event.target === applyOverlay) closeApplyModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && applyOverlay.classList.contains('open')) closeApplyModal();
});

// Application wizard — step navigation
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
const formLoadedAt = document.getElementById('form_loaded_at');
if (formLoadedAt) formLoadedAt.value = String(Date.now());

const wizardSteps = Array.from(form.querySelectorAll('.wizard-step'));
const wizardTotalSteps = wizardSteps.length;
const wizardProgressFill = document.getElementById('wizardProgressFill');
const wizardStepLabel = document.getElementById('wizardStepLabel');
const wizardBackBtn = document.getElementById('wizardBackBtn');
const wizardNextBtn = document.getElementById('wizardNextBtn');
const wizardSubmitBtn = document.getElementById('wizardSubmitBtn');
let wizardCurrentStep = 1;

function updateWizardUI() {
  wizardSteps.forEach((step) => {
    step.classList.toggle('active', Number(step.dataset.step) === wizardCurrentStep);
  });
  wizardProgressFill.style.width = ((wizardCurrentStep / wizardTotalSteps) * 100) + '%';
  wizardStepLabel.textContent = `Step ${wizardCurrentStep} of ${wizardTotalSteps}`;
  wizardBackBtn.style.display = wizardCurrentStep === 1 ? 'none' : 'inline-flex';
  wizardNextBtn.style.display = wizardCurrentStep === wizardTotalSteps ? 'none' : 'inline-flex';
  wizardSubmitBtn.style.display = wizardCurrentStep === wizardTotalSteps ? 'inline-flex' : 'none';
}

function wizardStepIsValid(stepEl) {
  const fields = stepEl.querySelectorAll('input, select, textarea');
  for (const field of fields) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }
  return true;
}

wizardNextBtn.addEventListener('click', () => {
  const stepEl = wizardSteps[wizardCurrentStep - 1];
  if (!wizardStepIsValid(stepEl)) return;
  if (wizardCurrentStep < wizardTotalSteps) {
    wizardCurrentStep++;
    updateWizardUI();
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});

wizardBackBtn.addEventListener('click', () => {
  if (wizardCurrentStep > 1) {
    wizardCurrentStep--;
    updateWizardUI();
  }
});

updateWizardUI();

// Contact form submission via Web3Forms
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const finalStep = wizardSteps[wizardCurrentStep - 1];
  if (!wizardStepIsValid(finalStep)) return;

  if (form.botcheck.checked) return; // spam honeypot

  // Reject submissions completed implausibly fast (bots filling forms instantly)
  const loadedAt = Number(formLoadedAt.value);
  if (loadedAt && Date.now() - loadedAt < 3000) {
    status.textContent = "Thanks — we'll be in touch within one business day.";
    status.className = 'form-status success';
    setTimeout(closeApplyModal, 2500);
    return;
  }

  wizardSubmitBtn.disabled = true;
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
      wizardCurrentStep = 1;
      updateWizardUI();
      setTimeout(closeApplyModal, 2500);
    } else {
      throw new Error(result.message || 'Submission failed');
    }
  } catch (err) {
    status.textContent = 'Something went wrong. Please call 919-395-2411 or try again.';
    status.className = 'form-status error';
  } finally {
    wizardSubmitBtn.disabled = false;
  }
});
