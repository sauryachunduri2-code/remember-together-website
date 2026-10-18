// Shared motion for the site. Every animation here answers something the visitor did.
// Short and calm (120 to 250ms), no overshoot, and nothing moves when the device asks for
// reduced motion: elements simply appear or disappear.
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
