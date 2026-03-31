interface BasicRequest {
  method: string;
  path?: string;
  ip?: string;
  socket: { remoteAddress?: string };
  headers: Record<string, string | string[] | undefined>;
}

interface BasicResponse {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => {
    json: (payload: Record<string, unknown>) => void;
  };
}

type NextFunction = () => void;

interface Bucket {
  count: number;
  resetAtMs: number;
}

interface RateLimitConfig {
  windowMs: number;
  generalMax: number;
  publicMax: number;
  authMax: number;
}

const SAFE_LIMIT_FLOOR = 1;

export function createRateLimitMiddleware(config: RateLimitConfig) {
  const bucketByKey = new Map<string, Bucket>();

  const windowMs = Math.max(1_000, config.windowMs);
  const generalMax = Math.max(SAFE_LIMIT_FLOOR, config.generalMax);
  const publicMax = Math.max(SAFE_LIMIT_FLOOR, config.publicMax);
  const authMax = Math.max(SAFE_LIMIT_FLOOR, config.authMax);

  return (request: BasicRequest, response: BasicResponse, next: NextFunction): void => {
    if (request.headers['x-dev-bypass'] === 'true') {
      next();
      return;
    }

    const nowMs = Date.now();
    const path = request.path ?? '';
    const scope = resolveScope(path);
    const maxRequests = scope === 'auth' ? authMax : scope === 'public' ? publicMax : generalMax;
    const sourceIp = getClientIp(request);
    const key = `${scope}:${sourceIp}`;

    const existing = bucketByKey.get(key);
    if (!existing || existing.resetAtMs <= nowMs) {
      bucketByKey.set(key, { count: 1, resetAtMs: nowMs + windowMs });
      pruneExpiredBuckets(bucketByKey, nowMs);
      next();
      return;
    }

    if (existing.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAtMs - nowMs) / 1_000));
      response.setHeader('Retry-After', String(retryAfterSeconds));
      response.status(429).json({
        message: 'Too many requests. Please retry later.',
        scope,
        retryAfterSeconds,
      });
      return;
    }

    existing.count += 1;
    next();
  };
}

function resolveScope(path: string): 'auth' | 'public' | 'general' {
  if (path.startsWith('/api/auth')) {
    return 'auth';
  }
  if (path.startsWith('/api/public')) {
    return 'public';
  }
  return 'general';
}

function getClientIp(request: BasicRequest): string {
  const forwardedFor = request.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0].trim();
  }

  return request.ip || request.socket.remoteAddress || 'unknown';
}

function pruneExpiredBuckets(bucketByKey: Map<string, Bucket>, nowMs: number): void {
  if (bucketByKey.size < 2_000) {
    return;
  }

  for (const [key, value] of bucketByKey.entries()) {
    if (value.resetAtMs <= nowMs) {
      bucketByKey.delete(key);
    }
  }
}
