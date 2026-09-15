const navMenu = document.getElementById('navMenu');
const navToggle = document.getElementById('navToggle');
const menuIsMobile = window.matchMedia('(max-width: 1080px)');

function setMenu(open) {
  navMenu.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', window.siteI18n.t(open ? 'ui.closeMenu' : 'ui.openMenu'));
}
navToggle.addEventListener('click', () => setMenu(!navMenu.classList.contains('open')));
navMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('click', event => {
  if (!navMenu.contains(event.target) && !navToggle.contains(event.target)) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navMenu.classList.contains('open')) {
    setMenu(false);
    navToggle.focus();
  }
});
menuIsMobile.addEventListener('change', () => setMenu(false));
document.addEventListener('languagechange', () => setMenu(navMenu.classList.contains('open')));
document.getElementById('year').textContent = new Date().getFullYear();

const sectionLinks = [...navMenu.querySelectorAll('a[href^="#"]')];
let pending = false;
function updateSection() {
  pending = false;
  const candidates = sectionLinks.filter(link => {
    const section = document.querySelector(link.getAttribute('href'));
    return section && section.getBoundingClientRect().top <= 150;
  });
  const active = candidates.sort((a, b) =>
    document.querySelector(b.getAttribute('href')).getBoundingClientRect().top -
    document.querySelector(a.getAttribute('href')).getBoundingClientRect().top)[0];
  sectionLinks.forEach(link => {
    if (link === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', () => {
  if (!pending) { pending = true; requestAnimationFrame(updateSection); }
}, { passive: true });
window.addEventListener('resize', updateSection);
document.addEventListener('languagechange', updateSection);
updateSection();
