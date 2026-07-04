(() => {
  const form = document.querySelector('[data-contact-form]');
  const message = document.querySelector('[data-form-message]');

  if (!form || !message) return;

  const requiredFields = ['name', 'phone', 'village', 'animals', 'privacy'];

  const normalizePhone = (value) => value.replace(/[^\d+]/g, '');
  const isPhoneValid = (value) => /^\+?\d{10,15}$/.test(normalizePhone(value));

  const setMessage = (text, type) => {
    message.textContent = text;
    message.className = `form-message form-wide ${type ? `is-${type}` : ''}`;
  };

  const markInvalid = (field, invalid) => {
    field.classList.toggle('is-invalid', invalid);
    field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  };

  const fieldValue = (field) => {
    if (!field) return '';
    if (field.type === 'checkbox') return field.checked ? 'yes' : '';
    return String(field.value || '').trim();
  };

  const collectData = () => {
    const data = new FormData(form);
    return {
      source: data.get('source') || 'Форма контактов',
      name: data.get('name') || '',
      phone: data.get('phone') || '',
      village: data.get('village') || '',
      animals: data.get('animals') || '',
      count: data.get('count') || '',
      schedule: data.get('schedule') || '',
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
      throw new Error(result.error || 'Не удалось отправить заявку.');
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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    let firstInvalid = null;

    requiredFields.forEach((fieldName) => {
      const field = form.elements[fieldName];
      const invalid = !fieldValue(field);
      markInvalid(field, invalid);
      if (invalid && !firstInvalid) firstInvalid = field;
    });

    const phoneField = form.elements.phone;
    if (phoneField.value.trim() && !isPhoneValid(phoneField.value)) {
      markInvalid(phoneField, true);
      firstInvalid = firstInvalid || phoneField;
    }

    if (firstInvalid) {
      setMessage('Пожалуйста, заполните обязательные поля, подтвердите согласие и проверьте телефон.', 'error');
      firstInvalid.focus();
      return;
    }

    form.classList.add('is-sending');
    setMessage('Отправляем заявку...', '');

    try {
      await sendLead(collectData());
      setMessage('Заявка отправлена. С вами свяжутся по указанному телефону.', 'success');
      form.reset();
    } catch (error) {
      console.error(error);
      setMessage('Не удалось отправить заявку в Telegram. Проверьте подключение или свяжитесь по телефону/мессенджеру.', 'error');
    } finally {
      form.classList.remove('is-sending');
    }
  });
})();
