const year = document.getElementById('yr');
if (year) year.textContent = new Date().getFullYear();

const toc = document.querySelector('.toc');
const tocToggle = document.querySelector('.toc-toggle');
const tocLinks = [...document.querySelectorAll('.toc__link')];
const mobileToc = window.matchMedia('(max-width: 960px)');

function collapseToc(collapsed) {
  toc.classList.toggle('collapsed', collapsed);
  tocToggle.setAttribute('aria-expanded', String(!collapsed));
}
tocToggle.addEventListener('click', () => {
  if (mobileToc.matches) collapseToc(!toc.classList.contains('collapsed'));
});
tocLinks.forEach(link => link.addEventListener('click', () => {
  if (mobileToc.matches) {
    collapseToc(true);
    tocToggle.focus({ preventScroll: true });
  }
}));
mobileToc.addEventListener('change', () => collapseToc(mobileToc.matches));
collapseToc(mobileToc.matches);

let scheduled = false;
function updateContents() {
  scheduled = false;
  let active = tocLinks[0];
  tocLinks.forEach(link => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section && section.getBoundingClientRect().top <= 165) active = link;
  });
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40) {
    active = tocLinks[tocLinks.length - 1];
  }
  tocLinks.forEach(link => {
    link.classList.toggle('active', link === active);
    if (link === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', () => {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateContents); }
}, { passive: true });
window.addEventListener('resize', updateContents);
document.addEventListener('languagechange', updateContents);
updateContents();
