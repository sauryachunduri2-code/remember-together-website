// Shared motion for the site. Two kinds: quick responses to something the visitor did
// (120 to 250ms), and slow, gentle arrivals as a section scrolls into view or the page loads
// (400 to 900ms). No overshoot, nothing loops fast, and nothing moves when the device asks for
// reduced motion: elements simply appear.
// Uses motion/mini (the browser's own animation engine) to keep pages light.
import { animate } from 'motion/mini';

type Animation = ReturnType<typeof animate>;

const running = new WeakMap<Element, Animation>();

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function track(element: Element, animation: Animation) {
  running.get(element)?.stop();
  running.set(element, animation);
  return animation;
}

/** Shows a hidden element with a short fade and rise. */
export function reveal(element: HTMLElement, { y = 8, duration = 0.25 } = {}) {
  element.hidden = false;
  if (prefersReducedMotion()) return;
  track(
    element,
    animate(element, { opacity: [0, 1], transform: [`translateY(${y}px)`, 'translateY(0)'] }, { duration, ease: 'easeOut' }),
  );
}

/** Fades an element out, then hides it. */
export async function conceal(element: HTMLElement, { duration = 0.12 } = {}) {
  if (!prefersReducedMotion()) {
    await track(element, animate(element, { opacity: [1, 0] }, { duration, ease: 'easeIn' }));
  }
  element.hidden = true;
  element.style.opacity = '';
}

/** Opens a hidden block by growing it to its natural height. Safe to call mid-animation. */
export async function expand(element: HTMLElement, { duration = 0.25 } = {}) {
  const from = element.hidden ? 0 : element.getBoundingClientRect().height;
  running.get(element)?.stop();
  element.hidden = false;
  if (prefersReducedMotion()) return;
  element.style.height = '';
  const to = element.getBoundingClientRect().height;
  element.style.overflow = 'hidden';
  const animation = track(
    element,
    animate(element, { height: [`${from}px`, `${to}px`], opacity: [from ? 1 : 0, 1] }, { duration, ease: 'easeOut' }),
  );
  await animation;
  if (running.get(element) === animation) {
    element.style.height = '';
    element.style.overflow = '';
    element.style.opacity = '';
  }
}

/** Closes a block by shrinking it to nothing, then hides it. Safe to call mid-animation. */
export async function collapse(element: HTMLElement, { duration = 0.2 } = {}) {
  if (element.hidden) return;
  if (!prefersReducedMotion()) {
    const from = element.getBoundingClientRect().height;
    element.style.overflow = 'hidden';
    const animation = track(element, animate(element, { height: [`${from}px`, '0px'], opacity: [1, 0] }, { duration, ease: 'easeIn' }));
    await animation;
    if (running.get(element) !== animation) return;
  }
  element.hidden = true;
  element.style.height = '';
  element.style.overflow = '';
  element.style.opacity = '';
}

/** Draws an SVG check mark once, as confirmation. */
export function drawCheck(svg: SVGElement | null) {
  const path = svg?.querySelector('path');
  if (!path || prefersReducedMotion()) return;
  path.setAttribute('pathLength', '1');
  path.style.strokeDasharray = '1';
  animate(path, { strokeDashoffset: [1, 0] }, { duration: 0.35, delay: 0.1, ease: 'easeOut' });
}

/** A small, firm press on every button, so a tap or key press clearly registers. */
export function initPressFeedback(selector = '.button') {
  const down = (element: HTMLElement) => {
    if (prefersReducedMotion()) return;
    track(element, animate(element, { transform: 'scale(0.97)' }, { duration: 0.1, ease: 'easeOut' }));
  };
  const up = (element: HTMLElement) => {
    if (prefersReducedMotion() || !running.has(element)) return;
    track(element, animate(element, { transform: 'scale(1)' }, { duration: 0.18, ease: 'easeOut' }));
  };
  const target = (event: Event) => (event.target as Element | null)?.closest<HTMLElement>(selector) ?? null;

  document.addEventListener('pointerdown', (event) => {
    const element = target(event);
    if (!element || event.button !== 0) return;
    down(element);
    const release = () => {
      up(element);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
  });
  document.addEventListener('keydown', (event) => {
    const element = target(event);
    if (element && !event.repeat && (event.key === 'Enter' || event.key === ' ')) down(element);
  });
  document.addEventListener('keyup', (event) => {
    const element = target(event);
    if (element && (event.key === 'Enter' || event.key === ' ')) up(element);
  });
}

/** Eases content in as it scrolls into view. Mark elements with data-reveal. Siblings arriving together are staggered. */
export function initReveal() {
  const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
  document.documentElement.dataset.motionReady = '1';
  if (prefersReducedMotion() || !targets.length) {
    document.documentElement.classList.remove('js-motion');
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, index) => {
          const element = entry.target as HTMLElement;
          observer.unobserve(element);
          element.dataset.revealed = '';
          animate(
            element,
            { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] },
            { duration: 0.7, delay: Math.min(index * 0.09, 0.45), ease: [0.2, 0, 0, 1] },
          );
        });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );
  targets.forEach((element) => observer.observe(element));
}

/** Counts the first number in each [data-countup] element up from zero, once, when it scrolls into view. */
export function initCountUp() {
  const targets = [...document.querySelectorAll<HTMLElement>('[data-countup]')];
  if (prefersReducedMotion() || !targets.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target as HTMLElement;
        observer.unobserve(element);
        const full = element.textContent ?? '';
        const match = full.match(/\d+/);
        if (!match || match.index === undefined) return;
        const end = Number(match[0]);
        // Screen readers get the real text. The moving number is hidden from them.
        element.textContent = '';
        const spoken = document.createElement('span');
        spoken.className = 'visually-hidden';
        spoken.textContent = full;
        const shown = document.createElement('span');
        shown.setAttribute('aria-hidden', 'true');
        const number = document.createElement('span');
        number.textContent = '0';
        shown.append(full.slice(0, match.index), number, full.slice(match.index + match[0].length));
        element.append(spoken, shown);
        const start = performance.now();
        const duration = 1400;
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          number.textContent = String(Math.round(end * (1 - Math.pow(1 - t, 3))));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.6 },
  );
  targets.forEach((element) => observer.observe(element));
}

/** The hero sun rises: the arc lifts into place, then each ray draws outward. Afterwards CSS lets the rays glow slowly. */
export async function initSunrise(selector = '.hero-sun') {
  const sun = document.querySelector<SVGElement>(selector);
  if (!sun || prefersReducedMotion()) return;
  const arc = sun.querySelector<SVGPathElement>('.sun-arc');
  const rays = [...sun.querySelectorAll<SVGPathElement>('.sun-ray')];
  rays.forEach((ray) => {
    ray.setAttribute('pathLength', '1');
    ray.style.strokeDasharray = '1';
  });
  const animations: Animation[] = [];
  if (arc) animations.push(animate(arc, { opacity: [0, 1], transform: ['translateY(14px)', 'translateY(0)'] }, { duration: 0.9, delay: 0.2, ease: [0.2, 0, 0, 1] }));
  rays.forEach((ray, index) =>
    animations.push(animate(ray, { opacity: [0, 1], strokeDashoffset: [1, 0] }, { duration: 0.6, delay: 0.8 + index * 0.12, ease: 'easeOut' })),
  );
  await Promise.allSettled(animations);
  sun.classList.add('sun--risen');
}
