export function formatShanghai(date: Date, opts?: { withSeconds?: boolean }) {
  const withSeconds = opts?.withSeconds ?? true;
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

  const yyyy = get('year');
  const mm = get('month');
  const dd = get('day');
  const hh = get('hour');
  const mi = get('minute');
  const ss = withSeconds ? get('second') : '';

  return withSeconds
    ? `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
    : `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export function formatShanghaiDate(date: Date) {
  return formatShanghai(date, { withSeconds: false }).slice(0, 10);
}
