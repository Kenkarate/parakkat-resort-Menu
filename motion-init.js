(function () {
  window.__motionReady = true;

  if (typeof window.Motion === 'undefined') {
    document.documentElement.classList.add('motion-failed');
    return;
  }

  var animate = window.Motion.animate;
  var inView = window.Motion.inView;
  var hover = window.Motion.hover;
  var press = window.Motion.press;
  var stagger = window.Motion.stagger;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('no-motion');
    return;
  }

  try {
    // Hero: eyebrow + logo, then tagline + CTA, staggered entrance
    animate(
      '.hero-eyebrow, .hero-logo',
      { opacity: [0, 1], y: [-24, 0] },
      { duration: 0.7, ease: 'easeOut', delay: stagger(0.12) }
    );
    animate(
      '.hero-tagline, .hero-cta',
      { opacity: [0, 1], y: [24, 0] },
      { duration: 0.5, ease: 'easeOut', delay: stagger(0.15, { startDelay: 0.5 }) }
    );

    // Buttons / CTAs: hover / press micro-interactions
    hover('.btn', function (el) {
      animate(el, { scale: 1.05 }, { duration: 0.2 });
      return function () {
        animate(el, { scale: 1 }, { duration: 0.2 });
      };
    });
    press('.btn', function (el) {
      animate(el, { scale: 0.95 }, { duration: 0.1 });
      return function () {
        animate(el, { scale: 1 }, { duration: 0.15 });
      };
    });

    // Below-the-fold content: scroll-reveal, once per element
    inView(
      '.section-eyebrow, .section-heading, .welcome-inner, .menu-card, .gallery-item',
      function (el) {
        if (el.dataset.revealed) return;
        el.dataset.revealed = 'true';
        animate(el, { opacity: [0, 1], y: [40, 0] }, { duration: 0.6, ease: 'easeOut' });
      },
      { amount: 0.2, margin: '0px 0px 200px 0px' }
    );
  } catch (err) {
    document.documentElement.classList.add('motion-failed');
  }
})();
