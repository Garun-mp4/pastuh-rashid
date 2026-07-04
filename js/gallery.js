(() => {
  const gallery = document.querySelector('[data-gallery]');
  const modal = document.querySelector('[data-modal]');
  const modalImage = document.querySelector('[data-modal-image]');
  const modalCaption = document.querySelector('[data-modal-caption]');
  const modalClose = document.querySelector('[data-modal-close]');

  if (!gallery || !modal || !modalImage || !modalCaption || !modalClose) return;

  let lastFocusedElement = null;

  const openModal = (src, title, alt) => {
    lastFocusedElement = document.activeElement;
    modalImage.src = src;
    modalImage.alt = alt || title || 'Изображение галереи';
    modalCaption.textContent = title || '';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modalClose.focus();
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    setTimeout(() => {
      modalImage.src = '';
      modalImage.alt = '';
      modalCaption.textContent = '';
    }, 180);

    if (lastFocusedElement) lastFocusedElement.focus();
  };

  gallery.addEventListener('click', (event) => {
    const item = event.target.closest('.gallery__item');
    if (!item) return;

    const image = item.querySelector('img');
    openModal(item.dataset.full, item.dataset.title, image?.alt);
  });

  modalClose.addEventListener('click', closeModal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
})();
