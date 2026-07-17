type DiagnosticLevel = 'debug' | 'info' | 'warn' | 'error';
type DiagnosticFields = Record<string, unknown>;

const isProduction = process.env.NODE_ENV === 'production';
const diagnosticsEnabled =
  process.env.NEXT_PUBLIC_ENABLE_PERF_LOGS === 'true' ||
  process.env.ENABLE_PERF_LOGS === 'true' ||
  !isProduction;

function normalizeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: isProduction ? undefined : value.stack,
    };
  }
  if (typeof value === 'bigint') return value.toString();
  return value;
}

function normalizeFields(fields: DiagnosticFields = {}) {
  return Object.fromEntries(
    Object.entries(fields)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, normalizeValue(value)]),
  );
}

export function nowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function elapsedMs(startMs: number) {
  return Math.round((nowMs() - startMs) * 10) / 10;
}

export function createTraceId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function diagnosticsLog(level: DiagnosticLevel, event: string, fields: DiagnosticFields = {}) {
  if (!diagnosticsEnabled && level !== 'error') return;

  const payload = {
    ts: new Date().toISOString(),
    event,
    ...normalizeFields(fields),
  };
  const message = `[diagnostics] ${JSON.stringify(payload)}`;

  if (level === 'error') {
    console.error(message);
  } else if (level === 'warn') {
    console.warn(message);
  } else if (level === 'debug') {
    console.debug(message);
  } else {
    console.info(message);
  }
}
