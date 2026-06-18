export function getClientTimezone(body = {}, fallback = 'UTC') {
  return body.clientTimezone || body.timezone || fallback;
}

export function getLocalDate(timezone = 'UTC', date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getLocalDateTime(timezone = 'UTC', date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date).replace(',', '');
}

export function getDisplayTimestamp(timezone = 'UTC', date = new Date()) {
  return new Intl.DateTimeFormat([], {
    timeZone: timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
