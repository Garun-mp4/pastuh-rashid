(() => {
  const internalLinks = document.querySelectorAll('a[href^="#"]');

  internalLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;

      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', id);
    });
  });

  const faq = document.querySelector('[data-faq]');
  if (faq) {
    faq.addEventListener('click', (event) => {
      const question = event.target.closest('.faq-question');
      if (!question) return;

      const item = question.closest('.faq-item');
      const isOpen = item.classList.contains('is-open');

      item.classList.toggle('is-open', !isOpen);
      question.setAttribute('aria-expanded', String(!isOpen));
    });
  }
})();
