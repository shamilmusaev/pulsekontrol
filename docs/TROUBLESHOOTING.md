# Устранение проблем с Reddit API

## Проблема: Блокировка запросов к Reddit (HTTP 403 / CORS)

При развертывании приложения на Vercel (или других облачных платформах) данные из Reddit перестают загружаться, хотя локально все работает.

### Симптомы
1. **HTTP 403 Forbidden** при запросах с сервера (Vercel API Routes).
2. **CORS Error** при прямых запросах из браузера.
3. **SyntaxError: Unexpected token '<'** при использовании ненадежных прокси (возвращают HTML с ошибкой вместо JSON).

### Причина
Reddit активно блокирует запросы от:
1. **Облачных IP-адресов** (AWS, Vercel, Heroku и т.д.) — защита от ботов и скрейпинга.
2. **Неавторизованных клиентов** — требуют OAuth2 для серверных запросов.
3. **Браузеров (CORS)** — API Reddit не разрешает кросс-доменные запросы к JSON эндпоинтам с чужих доменов.

---

## Решение

Мы использовали **Client-side Fetching через CORS Proxy**.

### Почему это работает?
1. **Клиентская сторона:** Запрос инициируется из браузера пользователя, а не с сервера Vercel (IP которого в бане).
2. **CORS Proxy (`corsproxy.io`):** 
   - Прокси добавляет необходимые заголовки `Access-Control-Allow-Origin`, чтобы браузер разрешил запрос.
   - Прокси делает запрос к Reddit со своих серверов, которые (на данный момент) не находятся в массовом бане Reddit, в отличие от Vercel.

### Реализация кода

В файле `app/components/PulseKontrol.tsx`:

```typescript
// 1. Формируем URL к JSON API Reddit
const redditUrl = `https://www.reddit.com/r/${selectedSubreddit}/hot.json?limit=15`;

// 2. Оборачиваем URL через corsproxy.io
// encodeURIComponent обязателен, чтобы спецсимволы не сломали URL прокси
const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(redditUrl)}`;

// 3. Делаем запрос
const redditRes = await fetch(proxyUrl);

if (!redditRes.ok) {
  throw new Error(`Reddit fetch failed: ${redditRes.status}`);
}

// 4. Безопасно парсим JSON (важно!)
// Иногда прокси может вернуть HTML ошибку, поэтому нужен try/catch
const responseText = await redditRes.text();
try {
  const redditData = JSON.parse(responseText);
  // ... обработка данных ...
} catch (e) {
  console.error('Failed to parse Reddit JSON');
}
```

### Альтернативные решения (на будущее)

Если `corsproxy.io` перестанет работать, есть запасные варианты:

1. **RSS Feeds (Самый надежный запасной вариант):**
   Использовать RSS вместо JSON. Reddit реже банит RSS.
   URL: `https://www.reddit.com/r/subreddit/hot.rss`
   *Минус:* Нужно парсить XML, меньше данных (нет точного количества upvotes/comments).

2. **Публичные инстансы (Libreddit/Redlib):**
   Использовать альтернативные фронтенды Reddit в качестве API.
   Пример: `https://libreddit.kavin.rocks/r/subreddit/hot.json`
   *Минус:* Инстансы часто падают или исчезают.

3. **Официальная регистрация OAuth App:**
   Зарегистрировать приложение на Reddit, получить `CLIENT_ID` и `CLIENT_SECRET`, и делать запросы через сервер с авторизацией.
   *Минус:* Сложно в реализации, требует поддержки серверной части.

