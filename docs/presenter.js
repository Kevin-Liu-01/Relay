// Document-only controls. The shared results page has no slides and skips this.
(() => {
  const slides = [...document.querySelectorAll('.slide')];
  if (!slides.length) return;
  const byId = (id) => document.getElementById(id);
  const main = document.querySelector('main');
  const dock = document.querySelector('.presenter-dock');
  const notes = byId('presenter-notes');
  const overview = byId('slide-overview');
  const tools = byId('presenter-tools');
  const search = byId('slide-search');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const titles = slides.map((slide) =>
    slide.querySelector('h1, h2').textContent.replace(/\s+/g, ' ').trim(),
  );
  let index = 0,
    presenting = false,
    ownedFullscreen = false,
    layoutFrame = 0;
  document.body.classList.add('presentation-page');
  // One DOM copy: readable document flow normally, a bounded canvas in slide mode.
  for (const slide of slides) {
    const content = document.createElement('div');
    content.className = 'slide-content';
    content.append(...slide.childNodes);
    slide.append(content);
  }

  function layout() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(() => {
      const narrowNotes = !notes.hidden && innerWidth < 1000;
      main.inert = narrowNotes;
      main.setAttribute('aria-hidden', String(narrowNotes));
      if (!presenting) {
        for (const prop of ['--deck-scale', '--deck-x', '--deck-y'])
          main.style.removeProperty(prop);
        return;
      }
      const availableWidth =
        innerWidth - (!notes.hidden && innerWidth >= 1000 ? notes.offsetWidth + 20 : 0);
      const bottom = dock.getBoundingClientRect().top - 18;
      const scale = Math.min((availableWidth - 32) / 1280, (bottom - 18) / 720, 1.6);
      main.style.setProperty('--deck-scale', String(Math.max(0.1, scale)));
      main.style.setProperty('--deck-x', `${Math.max(16, (availableWidth - 1280 * scale) / 2)}px`);
      main.style.setProperty('--deck-y', `${Math.max(16, (bottom - 720 * scale) / 2)}px`);
      const content = slides[index].querySelector('.slide-content');
      const fit = Math.min(1, 640 / content.offsetHeight, 1168 / content.scrollWidth);
      content.style.setProperty('--content-scale', String(fit));
      content.style.setProperty('--content-x', `${(1280 - 1168 * fit) / 2}px`);
    });
  }

  function show(nextIndex, { pointer = false, focus = false } = {}) {
    const previous = index;
    index = Math.max(0, Math.min(slides.length - 1, nextIndex));
    slides.forEach((slide, n) => {
      slide.getAnimations().forEach((animation) => animation.cancel());
      slide.classList.toggle('active', n === index);
      slide.setAttribute('aria-hidden', String(n !== index));
    });
    byId('counter').textContent = `${index + 1} / ${slides.length}`;
    byId('current-topic').textContent = slides[index].dataset.title;
    byId('open-overview').setAttribute(
      'aria-label',
      `Open slide overview, slide ${index + 1} of ${slides.length}`,
    );
    byId('prev').disabled = index === 0;
    byId('next').disabled = index === slides.length - 1;
    byId('next').title =
      index < slides.length - 1 ? `Next: ${titles[index + 1]} (→)` : 'Last slide';
    const progress = byId('deck-progress');
    progress.setAttribute('aria-valuenow', String(index + 1));
    progress.setAttribute('aria-valuemax', String(slides.length));
    progress.setAttribute(
      'aria-valuetext',
      `Slide ${index + 1} of ${slides.length}: ${titles[index]}`,
    );
    progress.firstElementChild.style.transform = `scaleX(${(index + 1) / slides.length})`;
    byId('notes-title').textContent = `${index + 1}. ${titles[index]}`;
    byId('notes-content').replaceChildren(
      document.querySelector(`template[data-presenter-notes="${index}"]`).content.cloneNode(true),
    );
    byId('notes-content').scrollTop = 0;
    byId('notes-next-title').textContent = titles[index + 1] || 'End of presentation';
    byId('notes-next').disabled = index === slides.length - 1;
    for (const button of byId('slide-grid').querySelectorAll('button')) {
      if (Number(button.dataset.index) === index) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
    history.replaceState(null, '', `#${slides[index].dataset.slideId}`);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    layout();
    if (pointer && previous !== index && !reduced.matches)
      slides[index].animate([{ opacity: 0.65 }, { opacity: 1 }], {
        duration: 150,
        easing: 'cubic-bezier(.23,1,.32,1)',
      });
    if (focus) {
      const heading = slides[index].querySelector('h1, h2');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }

  function openDialog(dialog, trigger, focusTarget) {
    if (document.querySelector('dialog[open]')) return;
    dialog.returnFocus = trigger;
    dialog.showModal();
    focusTarget?.focus();
  }
  for (const [dialog, close] of [
    [overview, 'close-overview'],
    [tools, 'close-tools'],
  ]) {
    byId(close).onclick = () => dialog.close();
    dialog.addEventListener('close', () => dialog.returnFocus?.focus({ preventScroll: true }));
    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();
      if (
        event.target === dialog &&
        (event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom)
      )
        dialog.close();
    });
  }
  const chapters = [
    [5, 'Approach'],
    [11, 'System design'],
    [15, 'Model results'],
    [18, 'Interface results'],
    [20, 'Next steps'],
  ];
  slides.forEach((slide, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.index = String(i);
    button.className = 'slide-card';
    const meta = document.createElement('span');
    meta.className = 'slide-card-meta';
    const number = document.createElement('span');
    number.textContent = String(i + 1).padStart(2, '0');
    const chapter = document.createElement('span');
    chapter.textContent = chapters.find(([end]) => i < end)[1];
    meta.append(number, chapter);
    const title = document.createElement('strong');
    title.textContent = titles[i];
    const topic = document.createElement('span');
    topic.className = 'slide-card-topic';
    topic.textContent = slide.dataset.title;
    button.append(meta, title, topic);
    button.onclick = (event) => {
      // Native dialog closing restores its trigger first, then focus the destination.
      overview.returnFocus = null;
      overview.close();
      if (!notes.hidden && innerWidth < 1000) {
        toggleNotes(false);
        main.inert = false;
      }
      show(i, { pointer: event.detail > 0, focus: true });
    };
    byId('slide-grid').append(button);
  });
  function filterSlides() {
    const query = search.value.trim().toLowerCase();
    const number = /^\d+$/.test(query) ? Number(query) : null;
    let count = 0;
    for (const button of byId('slide-grid').children) {
      button.hidden =
        number === null
          ? !button.textContent.toLowerCase().includes(query)
          : Number(button.dataset.index) + 1 !== number;
      if (!button.hidden) count++;
    }
    byId('overview-count').textContent = `${count} of ${slides.length} slides`;
    byId('overview-empty').hidden = count !== 0;
    byId('slide-grid').scrollTop = 0;
  }
  function openOverview() {
    search.value = '';
    filterSlides();
    openDialog(overview, byId('open-overview'), search);
    byId('slide-grid')
      .querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }
  search.oninput = filterSlides;
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      byId('slide-grid').querySelector('button:not([hidden])')?.click();
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      byId('slide-grid').querySelector('button:not([hidden])')?.focus();
    }
  });
  byId('open-overview').onclick = openOverview;

  function toggleNotes(open = notes.hidden) {
    notes.hidden = !open;
    document.body.classList.toggle('notes-open', open);
    byId('toggle-notes').setAttribute('aria-expanded', String(open));
    byId('toggle-notes').setAttribute(
      'aria-label',
      open ? 'Hide speaker notes' : 'Show speaker notes',
    );
    if (open) byId('close-notes').focus({ preventScroll: true });
    else byId('toggle-notes').focus({ preventScroll: true });
    layout();
  }
  byId('toggle-notes').onclick = () => toggleNotes();
  byId('close-notes').onclick = () => toggleNotes(false);
  byId('notes-next').onclick = (event) => show(index + 1, { pointer: event.detail > 0 });

  function setPresenting(value) {
    presenting = value;
    document.body.classList.toggle('deck-presenting', value);
    byId('toggle-present').setAttribute('aria-pressed', String(value));
    byId('toggle-present').setAttribute('aria-label', value ? 'Back to document' : 'Enter slides');
    byId('toggle-present').querySelector('.present-enter').hidden = value;
    byId('toggle-present').querySelector('.present-exit').hidden = !value;
    byId('toggle-present').querySelector('.dock-label').textContent = value
      ? 'Exit slides'
      : 'Enter slides';
    byId('toggle-present').title = value ? 'Back to document (Esc)' : 'Enter slides (F)';
    layout();
  }
  let fullscreenBusy = false;
  async function togglePresenting() {
    if (fullscreenBusy) return;
    fullscreenBusy = true;
    byId('toggle-present').disabled = true;
    const value = !presenting;
    setPresenting(value);
    try {
      if (value && !document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        ownedFullscreen = true;
      } else if (!value && ownedFullscreen && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      byId('presenter-status').textContent =
        'Browser fullscreen is unavailable. Presentation view still fits this window.';
    } finally {
      fullscreenBusy = false;
      byId('toggle-present').disabled = false;
    }
  }
  byId('toggle-present').onclick = togglePresenting;
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && ownedFullscreen) {
      ownedFullscreen = false;
      setPresenting(false);
    }
    layout();
  });

  function openTools() {
    byId('slide-link').value =
      `https://relay.kevinliu.studio/presentation#${slides[index].dataset.slideId}`;
    byId('share-status').textContent = '';
    openDialog(tools, byId('open-tools'), byId('copy-slide'));
  }
  byId('open-tools').onclick = openTools;
  byId('copy-slide').onclick = async () => {
    try {
      await navigator.clipboard.writeText(byId('slide-link').value);
      byId('share-status').textContent = 'Slide link copied.';
    } catch {
      byId('share-status').textContent = 'Copy the selected link below.';
      byId('slide-link').focus();
      byId('slide-link').select();
    }
  };

  let elapsed = 0,
    started = null,
    ticker = null;
  function updateTimer() {
    const seconds = Math.floor(
      (elapsed + (started === null ? 0 : performance.now() - started)) / 1000,
    );
    byId('talk-time').textContent =
      `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  byId('timer-toggle').onclick = () => {
    if (started === null) {
      started = performance.now();
      ticker = setInterval(updateTimer, 250);
    } else {
      elapsed += performance.now() - started;
      started = null;
      clearInterval(ticker);
    }
    byId('timer-toggle').textContent = started === null ? 'Resume timer' : 'Pause timer';
    byId('timer-toggle').setAttribute('aria-pressed', String(started !== null));
    updateTimer();
  };
  byId('timer-reset').onclick = () => {
    elapsed = 0;
    started = null;
    clearInterval(ticker);
    updateTimer();
    byId('timer-toggle').textContent = 'Start timer';
    byId('timer-toggle').setAttribute('aria-pressed', 'false');
  };
  window.addEventListener('pagehide', () => {
    clearInterval(ticker);
    ticker = null;
  });
  window.addEventListener('pageshow', () => {
    if (started !== null && ticker === null) ticker = setInterval(updateTimer, 250);
  });

  byId('prev').onclick = (event) => show(index - 1, { pointer: event.detail > 0 });
  byId('next').onclick = (event) => show(index + 1, { pointer: event.detail > 0 });
  document.addEventListener('keydown', (event) => {
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      document.querySelector('dialog[open]')
    )
      return;
    const key = event.key.toLowerCase();
    if (key === 'escape') {
      if (!notes.hidden) toggleNotes(false);
      else if (presenting) void togglePresenting();
      return;
    }
    if (
      event.target.closest(
        'input, select, textarea, [contenteditable]:not([contenteditable="false"]), .table-scroll, .sort-tools, .task-filter',
      )
    )
      return;
    if (key === 'n') {
      event.preventDefault();
      toggleNotes();
      return;
    }
    if (key === 'g' || key === '/') {
      event.preventDefault();
      openOverview();
      return;
    }
    if (key === 'f') {
      event.preventDefault();
      void togglePresenting();
      return;
    }
    if (key === '?') {
      event.preventDefault();
      openTools();
      return;
    }
    if (
      event.target.closest('.presenter-notes') ||
      (key === ' ' && event.target.closest('button, a'))
    )
      return;
    const nextIndex = ['arrowright', 'pagedown', ' '].includes(key)
      ? index + 1
      : ['arrowleft', 'pageup'].includes(key)
        ? index - 1
        : key === 'home'
          ? 0
          : key === 'end'
            ? slides.length - 1
            : null;
    if (nextIndex !== null) {
      event.preventDefault();
      show(nextIndex);
    }
  });
  function hashIndex() {
    const hash = location.hash.slice(1);
    const named = slides.findIndex((slide) => slide.dataset.slideId === hash);
    return named >= 0 ? named : /^\d+$/.test(hash) ? Number(hash) - 1 : 0;
  }
  window.addEventListener('hashchange', () => show(hashIndex()));
  window.addEventListener('resize', layout);
  window.addEventListener('beforeprint', () => {
    main.inert = false;
    main.removeAttribute('aria-hidden');
  });
  window.addEventListener('afterprint', layout);
  const observer = new ResizeObserver(layout);
  for (const slide of slides) observer.observe(slide.querySelector('.slide-content'));
  observer.observe(dock);
  document.fonts.ready.then(layout);
  show(hashIndex());
})();
