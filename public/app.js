(() => {
  const screens = [...document.querySelectorAll('.screen')];
  const phone = document.querySelector('.phone');
  const dateDialog = document.querySelector('#date-dialog');
  const learnDialog = document.querySelector('#learn-dialog');
  const dateInput = document.querySelector('#birthday-input');
  const dateError = document.querySelector('#date-error');
  const saveDateButton = document.querySelector('#save-date');
  const restartAgeButton = document.querySelector('#restart-age');
  const datePatch = document.querySelector('#date-patch');
  const screenStatus = document.querySelector('#screen-status');
  const columns = [...document.querySelectorAll('[data-wheel]')];
  const notificationCover = document.querySelector('#notification-cover');
  const notificationButton = document.querySelector('#notification-button');
  const ctaLink = document.querySelector('#cta-link');
  const german = document.documentElement.lang.toLowerCase().startsWith('de');
  const months = german
    ? ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
    : ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const messages = german ? {
    notification: 'Beispielbenachrichtigung verfügbar',
    showing: name => `${{age:'Altersbestätigung',birthday:'Geburtsdatum',selected:'Auswahl',steps:'Letzte Schritte',waiting:'Warten auf Benachrichtigung'}[name]} wird angezeigt`,
    noTries: 'Keine Versuche übrig. Starte von vorn, um es erneut zu versuchen.',
    tooYoung: remaining => `Du musst mindestens 13 Jahre alt sein. ${remaining} ${remaining === 1 ? 'Versuch' : 'Versuche'} übrig.`,
    invalidDate: 'Wähle ein gültiges Geburtsdatum.'
  } : {
    notification: 'Sample notification available',
    showing: name => `Showing ${name} screen`,
    noTries: 'No tries remaining. Start over to try again.',
    tooYoung: remaining => `You must be at least 13 years old. ${remaining} ${remaining === 1 ? 'try' : 'tries'} remaining.`,
    invalidDate: 'Choose a valid birthday.'
  };
  const offsets = [-2, -1, 0, 1, 2];
  const oldestYear = 1900;
  let birthday = new Date(2000, 0, 17);
  let attemptsRemaining = 3;
  let notificationTimer;
  let drag = null;
  let suppressClickUntil = 0;

  function show(name) {
    clearTimeout(notificationTimer);
    phone.dataset.activeScreen = name;
    notificationCover.classList.remove('revealed');
    if (notificationButton) notificationButton.hidden = true;
    for (const screen of screens) {
      const active = screen.dataset.screen === name;
      screen.hidden = !active;
      screen.classList.toggle('active', active);
    }
    if (name === 'waiting') {
      notificationTimer = setTimeout(() => {
        notificationCover.classList.add('revealed');
        if (notificationButton) notificationButton.hidden = false;
        screenStatus.textContent = messages.notification;
      }, 1800);
    }
    screenStatus.textContent = messages.showing(name);
    window.scrollTo(0, 0);
  }

  function isoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  function dateFromInput(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }
  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  function age(date) {
    const today = new Date();
    let years = today.getFullYear() - date.getFullYear();
    if (today.getMonth() < date.getMonth() || (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())) years--;
    return years;
  }

  function wheelValues(field) {
    const year = birthday.getFullYear();
    const month = birthday.getMonth();
    const day = birthday.getDate();
    const maxDay = daysInMonth(year, month);
    if (field === 'month') return {value: month, min: 0, max: 11, labels: offsets.map(offset => months[month + offset] || '')};
    if (field === 'day') return {value: day, min: 1, max: maxDay, labels: offsets.map(offset => day + offset >= 1 && day + offset <= maxDay ? String(day + offset) : '')};
    return {value: year, min: oldestYear, max: new Date().getFullYear(), labels: offsets.map(offset => year - offset >= oldestYear && year - offset <= new Date().getFullYear() ? String(year - offset) : '')};
  }
  function renderBirthday() {
    datePatch.textContent = german
      ? `${birthday.getDate()}. ${months[birthday.getMonth()]} ${birthday.getFullYear()}`
      : `${months[birthday.getMonth()]} ${birthday.getDate()}, ${birthday.getFullYear()}`;
    for (const column of columns) {
      const field = column.dataset.wheel;
      const data = wheelValues(field);
      column.replaceChildren(...data.labels.map((label, index) => {
        const row = document.createElement('span');
        row.className = 'wheel-row';
        row.dataset.offset = String(offsets[index]);
        row.textContent = label;
        return row;
      }));
      column.setAttribute('aria-valuemin', String(data.min));
      column.setAttribute('aria-valuemax', String(data.max));
      column.setAttribute('aria-valuenow', String(data.value));
      column.setAttribute('aria-valuetext', field === 'month' ? months[data.value] : String(data.value));
    }
  }
  function changeWheel(field, steps) {
    if (!steps) return;
    let year = birthday.getFullYear();
    let month = birthday.getMonth();
    let day = birthday.getDate();
    if (field === 'month') month = Math.max(0, Math.min(11, month + steps));
    if (field === 'day') day = Math.max(1, Math.min(daysInMonth(year, month), day + steps));
    if (field === 'year') year = Math.max(oldestYear, Math.min(new Date().getFullYear(), year - steps));
    day = Math.min(day, daysInMonth(year, month));
    birthday = new Date(year, month, day);
    renderBirthday();
  }

  for (const column of columns) {
    const field = column.dataset.wheel;
    column.addEventListener('wheel', event => {
      event.preventDefault();
      changeWheel(field, event.deltaY > 0 ? 1 : -1);
    }, {passive: false});
    column.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      drag = {id: event.pointerId, field, startY: event.clientY, lastY: event.clientY, moved: false};
      column.setPointerCapture(event.pointerId);
    });
    column.addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId || drag.field !== field) return;
      const threshold = column.clientHeight / 9;
      const difference = drag.lastY - event.clientY;
      if (Math.abs(difference) < threshold) return;
      const steps = Math.trunc(difference / threshold);
      changeWheel(field, steps);
      drag.lastY = event.clientY;
      drag.moved = true;
      suppressClickUntil = Date.now() + 350;
    });
    column.addEventListener('pointerup', event => {
      if (!drag || drag.id !== event.pointerId || drag.field !== field) return;
      const difference = drag.startY - event.clientY;
      if (!drag.moved && Math.abs(difference) > 9) {
        changeWheel(field, difference > 0 ? 1 : -1);
        suppressClickUntil = Date.now() + 350;
      }
      drag = null;
    });
    column.addEventListener('pointercancel', () => { drag = null; });
    column.addEventListener('click', event => {
      if (Date.now() < suppressClickUntil) return;
      // Pointer capture retargets the click to the column, so resolve the row under the pointer.
      const direct = event.target instanceof Element ? event.target.closest('.wheel-row') : null;
      const row = direct || document.elementFromPoint(event.clientX, event.clientY)?.closest('.wheel-row');
      if (row && column.contains(row)) changeWheel(field, Number(row.dataset.offset));
    });
    column.addEventListener('keydown', event => {
      const steps = {ArrowDown: 1, ArrowUp: -1, PageDown: 5, PageUp: -5}[event.key];
      if (steps !== undefined) {
        event.preventDefault();
        changeWheel(field, steps);
      }
    });
  }

  document.addEventListener('click', event => {
    const go = event.target.closest('[data-go]');
    if (go) return show(go.dataset.go);
    const action = event.target.closest('[data-action]');
    if (!action) return;
    switch (action.dataset.action) {
      case 'edit-date':
        dateInput.value = isoDate(birthday);
        dateInput.max = isoDate(new Date());
        dateError.textContent = attemptsRemaining ? '' : messages.noTries;
        dateDialog.showModal();
        break;
      case 'confirm-date':
        if (!attemptsRemaining) {
          dateError.textContent = messages.noTries;
          dateDialog.showModal();
          break;
        }
        if (age(birthday) < 13) {
          attemptsRemaining--;
          dateInput.value = isoDate(birthday);
          dateError.textContent = attemptsRemaining ? messages.tooYoung(attemptsRemaining) : messages.noTries;
          if (!attemptsRemaining) {
            dateInput.disabled = true;
            saveDateButton.hidden = true;
            restartAgeButton.hidden = false;
          }
          dateDialog.showModal();
        } else show('selected');
        break;
      case 'learn':
        learnDialog.showModal();
        break;
    }
  });

  if (ctaLink) {
    const incomingSubid = new URLSearchParams(location.search).get('s1');
    const defaultSubid = german ? 'screentime-tt-de-demo' : 'screentime-tt-en-demo';
    const subid = incomingSubid && new RegExp(`^${defaultSubid}(?:-[a-z0-9-]+)?$`).test(incomingSubid)
      ? incomingSubid
      : defaultSubid;
    // Resolve the offer when tapped so a later campaign rewrite of the href is kept.
    ctaLink.addEventListener('click', () => {
      try {
        let offerUrl;
        if (typeof window.maxconv === 'function') {
          const resolved = window.maxconv('getOfferLink');
          if (typeof resolved === 'string' && /^https?:\/\//i.test(resolved)) offerUrl = resolved;
        }
        const destination = new URL(offerUrl || ctaLink.href);
        const incoming = new URLSearchParams(location.search);
        ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','ttclid','fbclid','gclid','clickid'].forEach(key => {
          if (incoming.has(key)) destination.searchParams.set(key, incoming.get(key));
        });
        destination.searchParams.set('s1', subid);
        ctaLink.href = destination.href;
      } catch (_) {}
      if (window.ttq && typeof window.ttq.track === 'function') {
        window.ttq.track('ClickButton', {content_id: subid, description: 'im_ready'});
      }
    });
  }

  document.querySelector('#date-form').addEventListener('submit', event => {
    event.preventDefault();
    const date = dateFromInput(dateInput.value);
    if (!date || date > new Date()) {
      dateError.textContent = messages.invalidDate;
      return;
    }
    birthday = date;
    renderBirthday();
    dateDialog.close();
  });
  document.querySelector('#cancel-date').addEventListener('click', () => dateDialog.close());
  restartAgeButton.addEventListener('click', () => {
    attemptsRemaining = 3;
    birthday = new Date(2000, 0, 17);
    dateInput.disabled = false;
    saveDateButton.hidden = false;
    restartAgeButton.hidden = true;
    dateError.textContent = '';
    renderBirthday();
    dateDialog.close();
    show('age');
  });
  document.querySelector('#close-learn').addEventListener('click', () => learnDialog.close());
  dateInput.max = isoDate(new Date());
  renderBirthday();
  show('age');
})();
