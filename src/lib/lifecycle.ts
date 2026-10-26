// Page lifecycle under Astro's <ClientRouter /> (decision 0002). Bundled scripts run once per
// visit, not once per page, so anything that touches the DOM must set up on `astro:page-load`
// (fired on the first load and after every navigation) and tear down on `astro:before-swap`.

/** Runs `setup` for every page. Its signal aborts when the page is swapped out. */
export function onPage(setup: (signal: AbortSignal) => void | (() => void)): void {
  let controller: AbortController | undefined;
  let cleanup: void | (() => void);

  const teardown = () => {
    controller?.abort();
    cleanup?.();
    controller = undefined;
    cleanup = undefined;
  };

  document.addEventListener("astro:page-load", () => {
    teardown();
    controller = new AbortController();
    cleanup = setup(controller.signal);
  });
  document.addEventListener("astro:before-swap", teardown);
}
