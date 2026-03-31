interface BasicRequest {
  method: string;
  headers: Record<string, string | string[] | undefined>;
}

interface BasicResponse {
  status: (code: number) => {
    json: (payload: Record<string, unknown>) => void;
  };
}

type NextFunction = () => void;

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfHeaderMiddleware(request: BasicRequest, response: BasicResponse, next: NextFunction): void {
  if (SAFE_METHODS.has(request.method)) {
    next();
    return;
  }

  const csrfHeader = request.headers['x-cmms-csrf'];
  if (typeof csrfHeader === 'string' && csrfHeader.trim().length >= 16) {
    next();
    return;
  }

  response.status(403).json({
    message: 'Missing CSRF header. Include x-cmms-csrf for state-changing requests.',
  });
}
