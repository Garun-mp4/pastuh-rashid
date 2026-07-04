const MAX_TEXT_LENGTH = 3500;

const readBody = (req) => new Promise((resolve, reject) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 50_000) {
      reject(new Error('Request body is too large'));
      req.destroy();
    }
  });
  req.on('end', () => resolve(body));
  req.on('error', reject);
});

const parseBody = async (req) => {
  if (req.body && Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8'));
  if (req.body && typeof req.body === 'object') return req.body;
  if (req.body && typeof req.body === 'string') return JSON.parse(req.body);
  const rawBody = await readBody(req);
  return rawBody ? JSON.parse(rawBody) : {};
};

const clean = (value) => String(value || '').trim().slice(0, 1000);

const escapeHtml = (value) => clean(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const line = (label, value) => {
  const safeValue = escapeHtml(value);
  return safeValue ? `<b>${label}:</b> ${safeValue}` : '';
};

const buildMessage = (payload) => {
  const title = payload.source === 'Квиз на сайте'
    ? 'Новая заявка из квиза'
    : 'Новая заявка с сайта';

  return [
    `<b>${title}</b>`,
    line('Источник', payload.source),
    line('Имя', payload.name),
    line('Телефон', payload.phone),
    line('Село', payload.village),
    line('Ориентир/расстояние', payload.distance),
    line('Животные', payload.animals),
    line('Количество голов', payload.count),
    line('График', payload.schedule),
    line('Когда начать', payload.start),
    line('Комментарий', payload.comment),
    line('Страница', payload.page),
    payload.privacyAccepted ? '<b>Согласие:</b> подтверждено' : '<b>Согласие:</b> не подтверждено'
  ].filter(Boolean).join('\n').slice(0, MAX_TEXT_LENGTH);
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ error: 'Telegram environment variables are not configured.' });
  }

  try {
    const payload = await parseBody(req);
    const requiredFields = ['name', 'phone', 'village', 'animals'];
    const missing = requiredFields.filter((field) => !clean(payload[field]));

    if (missing.length > 0 || payload.privacyAccepted !== true) {
      return res.status(400).json({ error: 'Required fields are missing or consent is not confirmed.' });
    }

    const phone = clean(payload.phone).replace(/[^\d+]/g, '');
    if (!/^\+?\d{10,15}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number.' });
    }

    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage(payload),
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const telegramResult = await telegramResponse.json().catch(() => ({}));

    if (!telegramResponse.ok || telegramResult.ok === false) {
      return res.status(502).json({ error: 'Telegram API request failed.' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
