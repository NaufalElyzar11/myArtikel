// Mobile nav toggle
const navMenu = document.getElementById('navMenu');
const navToggle = document.getElementById('navToggle');

navToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = navMenu.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navMenu.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => {
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Close mobile nav when clicking outside
document.addEventListener('click', (e) => {
  if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !navToggle.contains(e.target)) {
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

// Close mobile nav on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navMenu.classList.contains('open')) {
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.focus();
  }
});

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Lightbox (photography contact sheet)
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCap = document.getElementById('lightboxCap');
let lastFocused = null;

function openLightbox(frame) {
  lastFocused = document.activeElement;
  const href = frame.getAttribute('href');
  const caption = frame.dataset.caption || '';
  const no = frame.dataset.no || '';
  lightboxImg.src = href;
  lightboxImg.alt = caption;
  lightboxCap.textContent = no ? `Frame ${no} — ${caption}` : caption;
  lightbox.setAttribute('aria-hidden', 'false');
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('lightboxCloseBtn').focus();
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxImg.src = '';
  document.body.style.overflow = '';
  if (lastFocused) lastFocused.focus();
}

document.querySelectorAll('.frame').forEach((frame) => {
  frame.addEventListener('click', (e) => {
    e.preventDefault();
    openLightbox(frame);
  });
});

document.getElementById('lightboxCloseBtn').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox(); });

// Subtle scroll reveal (skipped entirely under reduced-motion)
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealEls = document.querySelectorAll('.reveal');

if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('is-visible'));
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
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach((el) => observer.observe(el));
}
