(() => {
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('#main-menu');

  if (!burger || !menu) return;

  const closeMenu = () => {
    burger.classList.remove('is-active');
    burger.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };

  const openMenu = () => {
    burger.classList.add('is-active');
    burger.setAttribute('aria-expanded', 'true');
    menu.classList.add('is-open');
    document.body.classList.add('menu-open');
  };

  burger.addEventListener('click', () => {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  menu.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link) closeMenu();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) closeMenu();
  });
})();
