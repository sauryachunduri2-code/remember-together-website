// Validation, sending, and loading / success / error states for every form on the site.
import { collapse, conceal, drawCheck, expand, reveal } from './motion';

type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const TIMEOUT_MS = 15000;

function fieldsOf(form: HTMLFormElement): FieldElement[] {
  return Array.from(form.querySelectorAll<FieldElement>('input, textarea, select'));
}

function errorFor(field: FieldElement): HTMLElement | null {
  const ids = (field.getAttribute('aria-describedby') ?? '').split(' ');
  const id = ids.find((value) => value.endsWith('-error'));
  return id ? document.getElementById(id) : null;
}

function showFieldError(field: FieldElement, message: string | null) {
  const error = errorFor(field);
  if (message) {
    field.setAttribute('aria-invalid', 'true');
    if (error) {
      error.textContent = message;
      if (error.hidden) reveal(error, { y: -4, duration: 0.15 });
    }
  } else {
    field.removeAttribute('aria-invalid');
    if (error) { error.textContent = ''; error.hidden = true; }
  }
}

function validate(field: FieldElement): boolean {
  if (field.disabled) { showFieldError(field, null); return true; }
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) field.value = field.value.trimStart();
  const valid = field.checkValidity();
  showFieldError(field, valid ? null : field.dataset.error ?? 'Please check this field.');
  return valid;
}

/** Fields marked data-hide-when="checkboxName" are hidden and skipped while that box is checked. */
function wireConditionalFields(form: HTMLFormElement) {
  form.querySelectorAll<HTMLElement>('[data-hide-when]').forEach((block) => {
    const toggle = form.querySelector<HTMLInputElement>(`input[name="${block.dataset.hideWhen}"]`);
    if (!toggle) return;
    const sync = (animated: boolean) => {
      block.querySelectorAll<FieldElement>('input, textarea, select').forEach((field) => {
        field.disabled = toggle.checked;
        if (toggle.checked) showFieldError(field, null);
      });
      if (!animated) block.hidden = toggle.checked;
      else if (toggle.checked) collapse(block);
      else expand(block);
    };
    toggle.addEventListener('change', () => sync(true));
    sync(false);
  });
}

function collect(form: HTMLFormElement): Record<string, string> {
  const data: Record<string, string> = { form: form.dataset.rtForm ?? 'unknown' };
  fieldsOf(form).forEach((field) => {
    if (!field.name || field.disabled) return;
    if (field instanceof HTMLInputElement && field.type === 'checkbox') data[field.name] = field.checked ? 'Yes' : 'No';
    else data[field.name] = field.value.trim();
  });
  data.page = window.location.pathname;
  return data;
}

function setLoading(button: HTMLButtonElement, loading: boolean) {
  const label = button.querySelector<HTMLElement>('.submit-label');
  if (loading) {
    button.dataset.loading = '';
    button.setAttribute('aria-disabled', 'true');
    if (label) label.textContent = 'Sending';
  } else {
    delete button.dataset.loading;
    button.removeAttribute('aria-disabled');
    if (label) label.textContent = label.dataset.label ?? 'Send';
  }
}

async function send(endpoint: string, data: Record<string, string>) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // text/plain keeps this a "simple" request, which Google Apps Script accepts from any site.
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({ ok: response.ok }));
    if (!response.ok || !result.ok) throw new Error(result.error ?? `Status ${response.status}`);
  } finally {
    window.clearTimeout(timer);
  }
}

function wire(form: HTMLFormElement) {
  const wrap = form.closest<HTMLElement>('[data-rt-form-wrap]');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const errorBox = form.querySelector<HTMLElement>('.form-error');
  const errorText = form.querySelector<HTMLElement>('.form-error-text');
  const success = wrap?.querySelector<HTMLElement>('.form-success');
  const reset = wrap?.querySelector<HTMLButtonElement>('.form-reset');
  if (!button || !errorBox || !errorText || !success) return;

  wireConditionalFields(form);

  // Check a field when the person leaves it, then live as they fix it.
  fieldsOf(form).forEach((field) => {
    const isBox = field instanceof HTMLInputElement && field.type === 'checkbox';
    field.addEventListener('blur', () => { if ((!isBox && field.value) || field.hasAttribute('aria-invalid')) validate(field); });
    field.addEventListener('input', () => { if (field.hasAttribute('aria-invalid')) validate(field); });
    field.addEventListener('change', () => { if (field.hasAttribute('aria-invalid')) validate(field); });
  });

  const showError = (message: string) => {
    errorText.textContent = message;
    if (errorBox.hidden) reveal(errorBox, { y: -4, duration: 0.15 });
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.hasAttribute('data-loading')) return;
    errorBox.hidden = true;

    const invalid = fieldsOf(form).filter((field) => !validate(field));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    const endpoint = form.dataset.endpoint;
    const email = form.dataset.email;
    if (!endpoint) {
      showError(`Our forms are not connected yet. Please email us at ${email} and we will reply there.`);
      return;
    }

    setLoading(button, true);
    try {
      await send(endpoint, collect(form));
      await conceal(form);
      reveal(success);
      success.focus();
      drawCheck(success.querySelector('.success-mark svg'));
      if (typeof window.gtag === 'function') window.gtag('event', 'form_submit', { form_name: form.dataset.rtForm });
    } catch {
      showError(`We could not send that. Please check your internet connection and try again. If it still does not work, email us at ${email}.`);
    } finally {
      setLoading(button, false);
    }
  });

  reset?.addEventListener('click', () => {
    form.reset();
    fieldsOf(form).forEach((field) => showFieldError(field, null));
    form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((box) => box.dispatchEvent(new Event('change')));
    success.hidden = true;
    reveal(form);
    fieldsOf(form)[0]?.focus();
  });
}

export function initForms() {
  document.querySelectorAll<HTMLFormElement>('form[data-rt-form]').forEach((form) => {
    if (form.dataset.wired) return;
    form.dataset.wired = 'true';
    wire(form);
  });
}

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}
