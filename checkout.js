/* Shared by the calendar, upcoming-events.html, and Carrd's homepage. */
(() => {
  'use strict';
  if (window.CanvasCocktailsCheckout) return;
  const assetBase = new URL('.', document.currentScript.src);
  const parentOrigins = new Set(['https://canvasandcocktailslou.com', 'https://www.canvasandcocktailslou.com']);
  const supported = typeof HTMLDialogElement !== 'undefined' && !!HTMLDialogElement.prototype.showModal;
  const records = () => window.canvasCocktailsEvents || [];

  function linkId(link) {
    try {
      const url = new URL(link);
      if (url.protocol !== 'https:' || !/^(www\.)?eventbrite\.com$/.test(url.hostname)) return null;
      return url.pathname.match(/^\/e\/(?:[^/]*-)?(\d+)\/?$/)?.[1] || null;
    } catch { return null; }
  }

  function eventId(event) {
    const id = linkId(event.link);
    // A mismatched explicit ID must never sell tickets to a different session.
    return id && (!event.eventbriteId || String(event.eventbriteId) === id) ? id : null;
  }

  let sdkPromise;
  function loadSDK() {
    if (window.EBWidgets?.createWidget) return Promise.resolve();
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => fail(), 12000);
      function fail() {
        clearTimeout(timer);
        script.remove();
        reject(new Error('Checkout could not load'));
      }
      script.src = 'https://www.eventbrite.com/static/widgets/eb_widgets.js';
      script.referrerPolicy = 'origin-when-cross-origin';
      script.onload = () => {
        clearTimeout(timer);
        if (window.EBWidgets?.createWidget) resolve();
        else fail();
      };
      script.onerror = fail;
      document.head.appendChild(script);
    }).catch(error => { sdkPromise = null; throw error; });
    return sdkPromise;
  }

  // Fetch only the small checkout loader while the visitor reads the overview.
  // Ticket frames are still created only after an explicit booking click.
  function prepare() {
    loadSDK().catch(() => {}); // A booking click can retry a failed warmup.
    let origin;
    try { origin = new URL(document.referrer).origin; } catch {}
    if (window.self !== window.top && parentOrigins.has(origin)) {
      window.parent.postMessage({ type: 'cc-checkout-prepare' }, origin);
    }
  }

  const faqURL = 'https://canvasandcocktailslou.com/?view=faq';
  let dialog, title, status, fullPage, direct, slots, selected, previousOverflow;
  let help, successLink, loadingTimer;
  function stopLoadingTimer() { clearTimeout(loadingTimer); }
  function renderCheckout(widget) {
    stopLoadingTimer();
    const complete = widget.completed;
    status.classList.toggle('cc-loading', !complete && !widget.loaded && !widget.failed);
    status.textContent = complete
      ? 'You’re booked! 🎨🥂 Thanks for choosing Canvas & Cocktails. Check your email for your tickets—we can’t wait to paint with you!'
      : widget.failed ? 'Your tickets could not load. Please use one of the checkout links below.'
      : widget.loaded ? 'Secure checkout by Eventbrite.'
      : 'Loading your tickets… This may take a few seconds.';
    successLink.hidden = !complete;
    help.hidden = !!complete;
    help.open = !!widget.failed;
    help.querySelector('summary').textContent = widget.failed ? 'Open checkout another way' : 'Need help?';
    if (!complete && !widget.loaded && !widget.failed) {
      loadingTimer = setTimeout(() => {
        if (!dialog.open || slots.hidden || widgets.get(selected) !== widget) return;
        status.classList.remove('cc-loading');
        status.textContent = 'Still loading? Open checkout in a new tab.';
        help.open = true;
      }, 12000);
    }
  }

  // Carrd uses URL hashes for sections. Use a query flag for external FAQ links
  // so its section router can open Home normally before we scroll to the FAQ.
  function revealFAQ() {
    if (dialog?.open) dialog.close();
    document.querySelector('#overviewBackdrop')?.classList.remove('open');
    if (location.hash && location.hash !== '#home') location.hash = 'home';
    const deadline = Date.now() + 5000;
    function scrollWhenVisible() {
      const faq = document.getElementById('cc-faq');
      if (faq && faq.getClientRects().length && getComputedStyle(faq).visibility !== 'hidden') {
        faq.scrollIntoView({ block: 'start', behavior: 'auto' });
        const heading = faq.querySelector('h2');
        if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
      } else if (Date.now() < deadline) requestAnimationFrame(scrollWhenVisible);
    }
    // Allow native dialog close and Carrd's section transition to settle.
    setTimeout(scrollWhenVisible, 500);
  }
  const widgets = new Map();
  let paintingPreview;
  function buildDialog() {
    if (dialog) return;
    const style = document.createElement('style');
    style.textContent = `
      #cc-checkout { box-sizing:border-box; width:min(760px,calc(100% - 24px)); max-width:none;
        max-height:calc(100vh - 24px); max-height:calc(100dvh - 24px); padding:0; border:0;
        border-radius:14px; color:#161616; background:#fff; overflow:auto;
        font:14px/1.5 Montserrat,Arial,sans-serif; text-align:left; }
      #cc-checkout::backdrop { background:rgba(0,0,0,.76); }
      #cc-checkout .cc-checkout-header { position:sticky; top:0; z-index:1; background:#fff;
        display:flex; gap:16px; align-items:center; justify-content:space-between; padding:16px 20px; }
      #cc-checkout h2 { margin:0; font:700 18px/1.3 Montserrat,Arial,sans-serif; color:#161616; }
      #cc-checkout button { flex:none; width:44px; height:44px; border:0; border-radius:50%;
        background:#111; color:white; font:26px Arial,sans-serif; cursor:pointer; }
      #cc-checkout .cc-checkout-help { padding:0 20px 16px; }
      #cc-checkout p { margin:0 0 8px; }
      #cc-checkout [data-event-session] { margin:6px 0 0; font-size:13px; font-weight:600; }
      #cc-checkout .cc-price { color:#63388f; font-weight:700; }
      #cc-checkout a { color:#63388f; text-decoration:underline; display:inline-block; padding:8px 0; }
      #cc-checkout [hidden] { display:none !important; }
      #cc-checkout iframe { width:100%; border:0; }
      #cc-checkout [data-slots] { min-height:425px; }
      #cc-checkout .cc-painting-preview { padding:0 20px 20px; }
      #cc-checkout .cc-painting-preview img { display:block; width:100%; height:240px; object-fit:contain; margin:0 0 16px; }
      #cc-checkout .cc-painting-preview h3 { margin:18px 0 8px; font-size:12px; font-weight:800; letter-spacing:.08em; }
      #cc-checkout .cc-painting-preview ul { margin:0 0 16px; padding-left:20px; list-style:disc; font-size:13px; line-height:1.7; }
      #cc-checkout [data-notes] { background:#f6f3fa; padding:1px 14px 14px; border-radius:8px; margin:16px 0; font-size:13px; }
      #cc-checkout .cc-painting-age { display:inline-block; margin:0 0 18px; padding:7px 10px; border-radius:5px; background:#f1f1f1; font-size:11px; font-weight:800; }
      #cc-checkout .cc-painting-preview a { display:block; padding:12px; text-align:center; color:white;
        background:linear-gradient(90deg,#7447a8,#d84c9a,#16acc7); border-radius:7px; text-decoration:none; font-weight:700; }
      #cc-checkout .cc-faq-link, #cc-checkout .cc-painting-preview a.cc-faq-link { display:block; background:none; color:#63388f; padding:8px 0 14px; font-size:13px; text-align:center; text-decoration:underline; }
      #cc-checkout .cc-painting-preview a.cc-directions { display:inline-block; background:none; color:#63388f; padding:4px 0 10px; text-align:left; text-decoration:underline; font-size:13px; }
      #cc-checkout [data-visit] { margin:16px 0; font-size:13px; }
      @media (max-width:480px) { #cc-checkout .cc-painting-preview img { height:180px; } }
      #cc-checkout summary { cursor:pointer; padding:8px 0; color:#63388f; }
      #cc-checkout .cc-loading::before { content:""; display:inline-block; width:14px; height:14px; margin-right:9px; vertical-align:middle; border:2px solid #e9def2; border-top-color:#7447a8; border-radius:50%; animation:cc-spin .8s linear infinite; }
      @keyframes cc-spin { to { transform:rotate(360deg); } }
      @media (prefers-reduced-motion:reduce) { #cc-checkout .cc-loading::before { animation:none; } }
      #cc-checkout :focus-visible { outline:3px solid #16acc7; outline-offset:3px; }
    `;
    document.head.appendChild(style);
    dialog = document.createElement('dialog');
    dialog.id = 'cc-checkout';
    dialog.setAttribute('aria-labelledby', 'cc-checkout-title');
    dialog.innerHTML = `<div class="cc-checkout-header"><div><h2 id="cc-checkout-title"></h2><p data-event-session></p></div>
      <button type="button" aria-label="Close checkout" autofocus>×</button></div>
      <div class="cc-checkout-help"><p role="status" aria-live="polite"></p>
      <a class="cc-faq-link" data-cc-faq data-success-faq href="${faqURL}" target="_top" hidden>Before you arrive: View FAQs</a>
      <details data-recovery><summary>Need help?</summary>
      <a data-full-page target="_blank" rel="noopener" referrerpolicy="origin-when-cross-origin">Open checkout in a new tab</a>
      <span data-separator> · </span><a data-direct target="_blank" rel="noopener" referrerpolicy="origin-when-cross-origin">Continue on Eventbrite</a></details></div>
      <div data-slots></div>`;
    document.body.appendChild(dialog);
    title = dialog.querySelector('h2');
    status = dialog.querySelector('[role="status"]');
    fullPage = dialog.querySelector('[data-full-page]');
    direct = dialog.querySelector('[data-direct]');
    slots = dialog.querySelector('[data-slots]');
    help = dialog.querySelector('[data-recovery]');
    successLink = dialog.querySelector('[data-success-faq]');
    dialog.querySelector('button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      // The native close event is queued; a quick reopen must retain the original value.
      if (!dialog.open) {
        stopLoadingTimer();
        document.body.style.overflow = previousOverflow;
        previousOverflow = undefined;
      }
    });
    // Do not let the calendar's Escape handler close the underlying event overview.
    dialog.addEventListener('keydown', e => { if (e.key === 'Escape') e.stopPropagation(); });
  }

  function preview(event) {
    prepare();
    buildDialog();
    selected = null;
    stopLoadingTimer();
    dialog.querySelector("button").setAttribute("aria-label", "Close painting preview");
    title.textContent = event.title;
    const date = new Date(`${event.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    dialog.querySelector('[data-event-session]').textContent = `${date} • ${event.timeRange || event.time}`;
    if (!paintingPreview) {
      paintingPreview = document.createElement('div');
      paintingPreview.className = 'cc-painting-preview';
      paintingPreview.innerHTML = '<p class="cc-price" data-price></p><img alt=""><h3>OVERVIEW</h3><p></p><section data-includes><h3>WHAT\'S INCLUDED</h3><ul></ul></section><p class="cc-bar-details">🍸 Full service bar with a bartender. <strong>Drinks sold separately.</strong></p><section data-visit><h3>PLAN YOUR VISIT</h3><p data-venue></p><a class="cc-directions" data-directions target="_blank" rel="noopener">Get Directions</a><p data-arrival></p></section><section data-notes><h3>PLEASE NOTE</h3><p></p><strong>No refunds.</strong></section><div><span class="cc-painting-age"></span></div><a class="cc-faq-link" data-cc-faq target="_top">Questions? View FAQs</a><a id="cc-preview-checkout" target="_blank" rel="noopener">BOOK THIS EVENT</a>';
      dialog.appendChild(paintingPreview);
    }
    paintingPreview.querySelector('[data-price]').textContent = event.priceLabel || '';
    paintingPreview.querySelector('[data-price]').hidden = !event.priceLabel;
    paintingPreview.querySelector('img').src = event.image;
    paintingPreview.querySelector('img').alt = `${event.title} finished painting`;
    paintingPreview.querySelector('h3 + p').textContent = event.description || '';
    const includes = Array.isArray(event.includes) ? event.includes : [];
    const list = paintingPreview.querySelector('ul');
    list.replaceChildren();
    for (const item of includes) {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    }
    paintingPreview.querySelector('[data-includes]').hidden = includes.length === 0;
    paintingPreview.querySelector('[data-venue]').textContent = [event.venueName, event.venueAddress].filter(Boolean).join(' · ');
    const directions = paintingPreview.querySelector('[data-directions]');
    directions.href = event.directionsURL || '#';
    directions.hidden = !event.directionsURL;
    paintingPreview.querySelector('[data-arrival]').textContent = event.arrivalNote || '';
    paintingPreview.querySelector('[data-visit]').hidden = !event.venueAddress && !event.arrivalNote;
    paintingPreview.querySelector('[data-notes] p').textContent = event.attendanceNotes || '';
    paintingPreview.querySelector('[data-notes]').hidden = !event.attendanceNotes;
    const age = paintingPreview.querySelector('.cc-painting-age');
    age.textContent = event.age || '';
    age.hidden = !event.age;
    paintingPreview.querySelector('[data-cc-faq]').href = faqURL;
    paintingPreview.querySelector('#cc-preview-checkout').href = event.link;
    paintingPreview.hidden = false;
    slots.hidden = true;
    dialog.querySelector('.cc-checkout-help').hidden = true;
    if (!dialog.open) {
      if (previousOverflow === undefined) previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
    }
    dialog.scrollTop = 0;
  }

  async function openLocal(event) {
    const id = eventId(event);
    if (!supported || !id) return;
    buildDialog();
    dialog.querySelector("button").setAttribute("aria-label", "Close checkout");
    if (paintingPreview) paintingPreview.hidden = true;
    slots.hidden = false;
    dialog.querySelector('.cc-checkout-help').hidden = false;
    selected = id;
    title.textContent = event.title;
    const date = new Date(`${event.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    dialog.querySelector('[data-event-session]').textContent = `${date} • ${event.timeRange || event.time}`;
    direct.href = event.link;
    const url = new URL('index.html', assetBase);
    url.searchParams.set('checkout', id);
    fullPage.href = url.href;
    fullPage.hidden = window.self === window.top && location.origin === assetBase.origin;
    dialog.querySelector('[data-separator]').hidden = fullPage.hidden;
    if (!dialog.open) {
      if (previousOverflow === undefined) previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
    }
    dialog.scrollTop = 0;
    for (const [key, widget] of widgets) widget.container.hidden = key !== id;
    let widget = widgets.get(id);
    if (!widget) {
      const container = document.createElement('div');
      container.id = `eventbrite-widget-container-${id}`;
      slots.appendChild(container);
      widget = { container, created: false, loaded: false, completed: false, failed: false };
      widgets.set(id, widget);
    }
    widget.container.hidden = false;
    widget.failed = false;
    renderCheckout(widget);
    if (widget.created) return;
    try {
      await loadSDK();
      if (selected !== id || !dialog.open || widget.created) return;
      window.EBWidgets.createWidget({
        widgetType: 'checkout', eventId: id,
        iframeContainerId: widget.container.id, iframeContainerHeight: 425,
        affiliateCode: new URL(event.link).searchParams.get('aff') || '',
        onOrderComplete: () => {
          widget.completed = true;
          if (selected === id && dialog.open && !slots.hidden) renderCheckout(widget);
        }
      });
      const frame = widget.container.querySelector('iframe');
      if (!frame) throw new Error('No checkout frame');
      frame.title = `Eventbrite checkout for ${event.title}, ${event.date} ${event.time}`;
      frame.referrerPolicy = 'origin-when-cross-origin';
      widget.created = true;
      // A frame load is a transport signal, not proof tickets rendered or an order succeeded.
      // Keep recovery available and use neutral text rather than declaring checkout ready.
      frame.addEventListener('load', () => {
        widget.loaded = true;
        if (selected === id && dialog.open && !slots.hidden) renderCheckout(widget);
      }, { once: true });
    } catch {
      widget.failed = true;
      if (selected === id && dialog.open && !slots.hidden) renderCheckout(widget);
    }
  }

  let pending;
  function open(event) {
    if (pending) clearTimeout(pending.timer);
    pending = null;
    let parentOrigin;
    try { parentOrigin = new URL(document.referrer).origin; } catch { /* Local checkout remains available. */ }
    if (window.self !== window.top && parentOrigins.has(parentOrigin)) {
      const requestId = `${Date.now()}-${Math.random()}`;
      const timer = setTimeout(() => { pending = null; openLocal(event); }, 700);
      pending = { requestId, timer, event, parentOrigin };
      window.parent.postMessage({ type: 'cc-checkout-probe', requestId }, parentOrigin);
    } else openLocal(event);
  }

  function trustedCalendar(message) {
    if (message.origin !== assetBase.origin) return false;
    return Array.from(document.querySelectorAll('iframe')).some(frame => {
      const url = new URL(frame.src, location.href);
      return frame.contentWindow === message.source && url.origin === assetBase.origin &&
        [assetBase.pathname, `${assetBase.pathname}index.html`].includes(url.pathname);
    });
  }
  window.addEventListener('message', message => {
    const data = message.data;
    if (!data || typeof data !== 'object' || !supported) return;
    if (data.type === 'cc-checkout-ready' && pending && message.source === window.parent &&
        message.origin === pending.parentOrigin && data.requestId === pending.requestId) {
      clearTimeout(pending.timer);
      message.source.postMessage({ type: 'cc-checkout-open', eventId: eventId(pending.event) }, message.origin);
      pending = null;
    } else if (window.self === window.top && trustedCalendar(message)) {
      if (data.type === 'cc-checkout-prepare') {
        prepare();
      } else if (data.type === 'cc-checkout-probe') {
        message.source.postMessage({ type: 'cc-checkout-ready', requestId: data.requestId }, message.origin);
      } else if (data.type === 'cc-checkout-open') {
        const event = records().find(item => eventId(item) === data.eventId);
        if (event) openLocal(event);
      }
    }
  });

  document.addEventListener('click', click => {
    if (click.defaultPrevented || click.button !== 0 || click.metaKey || click.ctrlKey || click.shiftKey || click.altKey || !supported) return;
    const link = click.target.closest('a');
    if (link?.matches('[data-cc-faq]')) {
      if (window.self === window.top && document.getElementById('cc-faq')) {
        click.preventDefault(); revealFAQ();
      }
      return; // Else use the real homepage link at the top level.
    }
    if (!link?.matches('#overviewTicket, #cc-preview-checkout, #cc-events-preview [data-role="tickets"], .cc-event-card')) return;
    const id = linkId(link.href);
    const event = records().find(item => id && eventId(item) === id);
    if (!event) return; // Keep the original link when data is missing or inconsistent.
    click.preventDefault();
    if (link.matches('#overviewTicket, #cc-preview-checkout')) open(event);
    else preview(event);
  });

  window.CanvasCocktailsCheckout = { open, eventId, prepare };
  if (window.self === window.top && new URL(location.href).searchParams.get('view') === 'faq') {
    if (document.readyState === 'complete') revealFAQ();
    else window.addEventListener('load', revealFAQ, { once: true });
  }
  const requested = new URL(location.href).searchParams.get('checkout');
  const event = records().find(item => requested && eventId(item) === requested);
  if (event && window.self === window.top) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => openLocal(event), { once: true });
    else openLocal(event);
  }
})();
