(() => {
  const form = document.querySelector('[data-quiz-form]');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll('[data-quiz-step]'));
  const progress = form.querySelector('[data-quiz-progress]');
  const prevButton = form.querySelector('[data-quiz-prev]');
  const nextButton = form.querySelector('[data-quiz-next]');
  const submitButton = form.querySelector('[data-quiz-submit]');
  const message = form.querySelector('[data-quiz-message]');
  let currentStep = 0;

  const normalizePhone = (value) => value.replace(/[^\d+]/g, '');
  const isPhoneValid = (value) => /^\+?\d{10,15}$/.test(normalizePhone(value));

  const setMessage = (text, type) => {
    message.textContent = text;
    message.className = `form-message ${type ? `is-${type}` : ''}`;
  };

  const markInvalid = (field, invalid) => {
    field.classList.toggle('is-invalid', invalid);
    field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  };

  const getValue = (field) => {
    if (!field) return '';
    if (field.type === 'checkbox') return field.checked ? 'yes' : '';
    return String(field.value || '').trim();
  };

  const update = () => {
    steps.forEach((step, index) => step.classList.toggle('is-active', index === currentStep));
    const percent = ((currentStep + 1) / steps.length) * 100;
    if (progress) progress.style.width = `${percent}%`;
    prevButton.hidden = currentStep === 0;
    nextButton.hidden = currentStep === steps.length - 1;
    submitButton.hidden = currentStep !== steps.length - 1;
    setMessage('', '');
  };

  const validateStep = (step) => {
    let firstInvalid = null;
    const fields = Array.from(step.querySelectorAll('input, select, textarea'));

    fields.forEach((field) => {
      if (!field.required) return;
      const invalid = !getValue(field);
      markInvalid(field, invalid);
      if (invalid && !firstInvalid) firstInvalid = field;
    });

    const phone = step.querySelector('input[name="phone"]');
    if (phone && phone.value.trim() && !isPhoneValid(phone.value)) {
      markInvalid(phone, true);
      firstInvalid = firstInvalid || phone;
    }

    if (firstInvalid) {
      setMessage('Заполните обязательные поля текущего шага.', 'error');
      firstInvalid.focus();
      return false;
    }

    return true;
  };

  const collectData = () => {
    const data = new FormData(form);
    return {
      source: data.get('source') || 'Квиз на сайте',
      name: data.get('name') || '',
      phone: data.get('phone') || '',
      village: data.get('village') || '',
      distance: data.get('distance') || '',
      animals: data.get('animals') || '',
      count: data.get('count') || '',
      schedule: data.get('schedule') || '',
      start: data.get('start') || '',
      comment: data.get('comment') || '',
      privacyAccepted: form.elements.privacy?.checked === true,
      page: window.location.href
    };
  };

  const sendLead = async (payload) => {
    const response = await fetch('/api/send-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || 'Не удалось отправить данные квиза.');
    }
    return result;
  };

  form.addEventListener('input', (event) => {
    const field = event.target;
    if (field.matches('input, select, textarea')) {
      markInvalid(field, false);
      setMessage('', '');
    }
  });

  nextButton.addEventListener('click', () => {
    if (!validateStep(steps[currentStep])) return;
    currentStep = Math.min(currentStep + 1, steps.length - 1);
    update();
  });

  prevButton.addEventListener('click', () => {
    currentStep = Math.max(currentStep - 1, 0);
    update();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateStep(steps[currentStep])) return;

    form.classList.add('is-sending');
    setMessage('Отправляем данные квиза...', '');

    try {
      await sendLead(collectData());
      setMessage('Данные квиза отправлены. С вами свяжутся по указанному телефону.', 'success');
      form.reset();
      currentStep = 0;
      update();
    } catch (error) {
      console.error(error);
      setMessage('Не удалось отправить данные в Telegram. Проверьте подключение или свяжитесь по телефону/мессенджеру.', 'error');
    } finally {
      form.classList.remove('is-sending');
    }
  });

  update();
})();
