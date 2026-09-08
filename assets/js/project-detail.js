/**
 * Shared JavaScript for Project Detail Case Studies
 * Handles ScrollSpy for sticky TOC, Lightbox for media, and dynamic year.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Dynamic Footer Year
  const yrEl = document.getElementById('yr');
  if (yrEl) {
    yrEl.textContent = new Date().getFullYear();
  }

  // 2. ScrollSpy for Table of Contents (TOC)
  const tocLinks = Array.from(document.querySelectorAll('.toc__link'));
  const sections = tocLinks
    .map(link => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        return document.querySelector(targetId);
      }
      return null;
    })
    .filter(Boolean);

  if (tocLinks.length && sections.length) {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140; // Offset for topbar
      let activeIndex = 0;

      sections.forEach((section, idx) => {
        if (section.offsetTop <= scrollPos) {
          activeIndex = idx;
        }
      });

      // Handle bottom of page
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
        activeIndex = sections.length - 1;
      }

      tocLinks.forEach((link, idx) => {
        if (idx === activeIndex) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial run
  }

  // 3. Lightbox for Project Gallery
  const galleryItems = document.querySelectorAll('.gallery__item');
  if (galleryItems.length > 0) {
    // Create Lightbox DOM if not already present
    let lb = document.querySelector('.lightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      lb.setAttribute('aria-hidden', 'true');
      lb.innerHTML = `
        <button class="lightbox__close" aria-label="Tutup preview">×</button>
        <img src="" alt="Pratinjau proyek" />
        <div class="lightbox__caption"></div>
      `;
      document.body.appendChild(lb);
    }

    const lbImg = lb.querySelector('img');
    const lbCap = lb.querySelector('.lightbox__caption');
    const closeBtn = lb.querySelector('.lightbox__close');

    const openLightbox = (src, caption) => {
      lbImg.src = src;
      lbImg.alt = caption || 'Pratinjau proyek';
      lbCap.textContent = caption || '';
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    };

    const closeLightbox = () => {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      lbImg.src = '';
      document.body.style.overflow = '';
    };

    galleryItems.forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        const fullSrc = item.getAttribute('href') || item.querySelector('img')?.src;
        const caption = item.dataset.caption || item.querySelector('img')?.alt || '';
        if (fullSrc) {
          openLightbox(fullSrc, caption);
        }
      });
    });

    closeBtn.addEventListener('click', closeLightbox);
    lb.addEventListener('click', e => {
      if (e.target === lb) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && lb.classList.contains('open')) {
        closeLightbox();
      }
    });
  }
});
