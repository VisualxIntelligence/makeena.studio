// Brief form behaviour (PRD §9.6, decision 0019). Set up per page (ClientRouter lifecycle):
// - Turnstile's script loads only when the form nears the viewport or gets focus, and renders
//   explicitly into the form (managed widget, page language);
// - the same validation rules as worker/brief.ts run before sending; errors sit under their
//   fields (aria-describedby, aria-invalid) and focus moves to the first one;
// - sending disables the button and shows a spinner; success replaces the form with a mono
//   confirmation line, announced in a live region;
// - the ON AIR tally is on while the form is on screen or a field has focus, and pulses only when
//   motion is allowed.
import { onPage } from "../../lib/lifecycle";
import { motion } from "../../lib/motion";

interface Turnstile {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(id?: string): void;
  remove(id?: string): void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

type Messages = Record<
  | "required"
  | "engagement"
  | "invalid"
  | "too_long"
  | "turnstile"
  | "turnstileInvalid"
  | "unavailable"
  | "done"
  | "errors",
  string
>;
type FieldError = "required" | "invalid" | "too_long";

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELDS = ["name", "company", "email", "engagement", "message", "turnstile"] as const;
type Field = (typeof FIELDS)[number];

let loading: Promise<Turnstile> | undefined;
function loadTurnstile(): Promise<Turnstile> {
  loading ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject());
    script.onerror = () => {
      loading = undefined;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.append(script);
  });
  return loading;
}

function setup(root: HTMLElement, signal: AbortSignal): () => void {
  const form = root.querySelector<HTMLFormElement>("[data-brief-form]")!;
  const submit = root.querySelector<HTMLButtonElement>("[data-submit]")!;
  const submitText = root.querySelector<HTMLElement>("[data-submit-text]")!;
  const spinner = root.querySelector<HTMLElement>(".brief__spinner")!;
  const formError = root.querySelector<HTMLElement>("[data-form-error]")!;
  const done = root.querySelector<HTMLElement>("[data-brief-done]")!;
  const doneRef = root.querySelector<HTMLElement>("[data-done-ref]")!;
  const live = root.querySelector<HTMLElement>("[data-brief-live]")!;
  const tally = root.querySelector<HTMLElement>("[data-tally]")!;
  const tallyText = root.querySelector<HTMLElement>("[data-tally-text]")!;
  const holder = root.querySelector<HTMLElement>("[data-turnstile]")!;
  const messages: Messages = JSON.parse(
    root.querySelector("[data-brief-messages]")?.textContent ?? "{}",
  );
  const submitLabel = submitText.textContent ?? "";
  let token = "";
  let widget: string | undefined;
  let sending = false;

  // #brief-fixed / #brief-retained preselect the engagement (links from /engagement/, or an
  // in-page link, which only changes the hash).
  const preset = () => {
    const value = location.hash.match(/^#brief-(fixed|retained)$/)?.[1];
    const radio = form.querySelector<HTMLInputElement>(
      `input[name="engagement"][value="${value}"]`,
    );
    if (radio) radio.checked = true;
  };
  preset();
  addEventListener("hashchange", preset, { signal });

  // Tally light: ON AIR while the form is on screen or has focus.
  let visible = false;
  let focused = false;
  const renderTally = () => {
    const on = !done.hidden ? false : visible || focused;
    tally.toggleAttribute("data-on", on);
    tally.toggleAttribute("data-pulse", on && motion.allowed);
    tallyText.textContent = on ? tallyText.dataset.on! : tallyText.dataset.off!;
  };
  const seen = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      renderTally();
    },
    { threshold: 0.2 },
  );
  seen.observe(form);
  form.addEventListener("focusin", () => ((focused = true), renderTally()), { signal });
  form.addEventListener(
    "focusout",
    () =>
      requestAnimationFrame(() => {
        focused = form.contains(document.activeElement);
        renderTally();
      }),
    { signal },
  );
  motion.onChange(renderTally, signal);

  // Turnstile: only near the form (or on first focus), never on page load.
  const startTurnstile = () => {
    if (widget !== undefined || signal.aborted) return;
    widget = "";
    loadTurnstile()
      .then((turnstile) => {
        if (signal.aborted) return;
        widget = turnstile.render(holder, {
          sitekey: root.dataset.sitekey,
          language: root.dataset.lang,
          theme: "light",
          action: "brief",
          "response-field": false,
          callback: (t: string) => {
            token = t;
            showError("turnstile", undefined);
          },
          "expired-callback": () => (token = ""),
          "error-callback": () => (token = ""),
        });
      })
      .catch(() => {
        widget = undefined;
      });
  };
  const near = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        near.disconnect();
        startTurnstile();
      }
    },
    { rootMargin: "200px 0px" },
  );
  near.observe(form);
  form.addEventListener("focusin", startTurnstile, { once: true, signal });

  const errorFor = (field: Field) => root.querySelector<HTMLElement>(`#brief-${field}-error`)!;
  const controlFor = (field: Field) =>
    field === "engagement"
      ? root.querySelector<HTMLElement>(".brief__engagement")
      : field === "turnstile"
        ? null
        : form.querySelector<HTMLElement>(`[name="${field}"]`);

  function text(field: Field, error: FieldError): string {
    if (field === "turnstile")
      return error === "invalid" ? messages.turnstileInvalid : messages.turnstile;
    if (field === "engagement") return messages.engagement;
    if (error === "invalid") return messages.invalid;
    if (error === "too_long") {
      const max = form.querySelector<HTMLInputElement>(`[name="${field}"]`)?.maxLength ?? 0;
      return messages.too_long.replace("{n}", String(max));
    }
    return messages.required;
  }

  function showError(field: Field, error: FieldError | undefined) {
    const el = errorFor(field);
    el.hidden = !error;
    el.textContent = error ? text(field, error) : "";
    const control = controlFor(field);
    if (error) control?.setAttribute("aria-invalid", "true");
    else control?.removeAttribute("aria-invalid");
  }

  function check(data: FormData): Partial<Record<Field, FieldError>> {
    const errors: Partial<Record<Field, FieldError>> = {};
    const get = (k: string) => String(data.get(k) ?? "").trim();
    if (!get("name")) errors.name = "required";
    if (!get("email")) errors.email = "required";
    else if (!EMAIL.test(get("email"))) errors.email = "invalid";
    if (!get("engagement")) errors.engagement = "required";
    if (!get("message")) errors.message = "required";
    if (!token) errors.turnstile = "required";
    return errors;
  }

  function showErrors(errors: Partial<Record<Field, FieldError>>) {
    for (const field of FIELDS) showError(field, errors[field]);
    const first = FIELDS.find((f) => errors[f]);
    if (!first) return;
    live.textContent = messages.errors;
    const control =
      first === "engagement"
        ? form.querySelector<HTMLInputElement>('input[name="engagement"]')
        : first === "turnstile"
          ? submit
          : form.querySelector<HTMLElement>(`[name="${first}"]`);
    control?.focus();
  }

  function busy(on: boolean) {
    sending = on;
    submit.disabled = on;
    form.setAttribute("aria-busy", String(on));
    spinner.hidden = !on;
    submitText.textContent = on ? submitText.dataset.sending! : submitLabel;
  }

  function resetTurnstile() {
    token = "";
    if (widget) window.turnstile?.reset(widget);
  }

  // A field's error updates as soon as it is corrected, not only on the next submit.
  form.addEventListener(
    "input",
    (event) => {
      const field = (event.target as HTMLInputElement).name as Field;
      if (!FIELDS.includes(field) || errorFor(field).hidden) return;
      showError(field, check(new FormData(form))[field]);
    },
    { signal },
  );

  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();
      if (sending) return;
      formError.hidden = true;
      startTurnstile();
      const data = new FormData(form);
      const errors = check(data);
      if (Object.keys(errors).length > 0) return showErrors(errors);
      showErrors({});
      data.set("cf-turnstile-response", token);

      busy(true);
      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: data,
          headers: { accept: "application/json" },
        });
        const body = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          id?: string;
          errors?: Partial<Record<Field, FieldError>>;
        };
        if (res.ok && body.ok) {
          form.hidden = true;
          done.hidden = false;
          doneRef.textContent = messages.done.replace(
            "{ref}",
            (body.id ?? "").slice(0, 8).toUpperCase(),
          );
          live.textContent = doneRef.textContent;
          done.focus();
          renderTally();
          return;
        }
        if (body.errors) {
          if (body.errors.turnstile) resetTurnstile();
          return showErrors(body.errors);
        }
        throw new Error(`brief: ${res.status}`);
      } catch {
        resetTurnstile();
        formError.textContent = messages.unavailable;
        formError.hidden = false;
        live.textContent = messages.unavailable;
      } finally {
        busy(false);
      }
    },
    { signal },
  );

  return () => {
    seen.disconnect();
    near.disconnect();
    if (widget) window.turnstile?.remove(widget);
  };
}

onPage((signal) => {
  const cleanups = [...document.querySelectorAll<HTMLElement>("[data-brief]")].map((root) =>
    setup(root, signal),
  );
  return () => cleanups.forEach((cleanup) => cleanup());
});
