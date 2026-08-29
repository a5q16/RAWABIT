/**
 * Rawabit v2 — Statistics Counter Animation
 * Uses IntersectionObserver to trigger smooth count-up animations
 * when the statistics section enters the viewport.
 */

export function initStatsAnimation(container) {
  const statNumbers = (container || document).querySelectorAll('.stat-number[data-target]');
  if (!statNumbers || statNumbers.length === 0) return;

  if (typeof IntersectionObserver === 'undefined') {
    statNumbers.forEach(el => animateCounter(el));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  statNumbers.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const rawTarget = el.getAttribute('data-target') || (el.dataset && el.dataset.target) || '0';
  const target = parseFloat(rawTarget) || 0;
  const isFloat = rawTarget.includes('.');
  const duration = 1800; // ms
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = target * easeProgress;

    if (isFloat) {
      el.textContent = current.toFixed(1);
    } else {
      el.textContent = Math.floor(current).toLocaleString();
    }

    if (progress < 1) {
      if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        window.requestAnimationFrame(update);
      } else {
        update(startTime + duration);
      }
    } else {
      el.textContent = isFloat ? target.toFixed(1) : target.toLocaleString();
    }
  }

  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    window.requestAnimationFrame(update);
  } else {
    update(startTime + duration);
  }
}
