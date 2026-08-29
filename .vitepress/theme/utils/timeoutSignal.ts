// A request timeout that holds even on browsers without `AbortSignal.timeout`.
// The native call self-manages its timer; the fallback wires an AbortController
// to a setTimeout so a hung fetch still aborts and re-enables the form instead
// of pinning status at "loading". Call `clear()` once the request settles so a
// completed request leaves no pending abort (and no leaked timer) behind.

export interface TimeoutSignal {
  // Undefined only when neither AbortSignal.timeout nor AbortController is
  // usable, leaving the request unbounded (as before) rather than throwing.
  signal: AbortSignal | undefined;
  clear: () => void;
}

const noOp = () => {};

// The premise here is non-conforming environments, so a partial polyfill that
// throws must degrade (to the fallback, then to unbounded) rather than escape
// and pin the form at "loading".
function nativeTimeoutSignal(timeoutMs: number): AbortSignal | undefined {
  if (
    typeof AbortSignal === "undefined" ||
    typeof AbortSignal.timeout !== "function"
  ) {
    return undefined;
  }
  try {
    return AbortSignal.timeout(timeoutMs);
  } catch {
    return undefined;
  }
}

function fallbackTimeoutSignal(timeoutMs: number): TimeoutSignal | undefined {
  if (typeof AbortController !== "function") {
    return undefined;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

export function withTimeoutSignal(timeoutMs: number): TimeoutSignal {
  const nativeSignal = nativeTimeoutSignal(timeoutMs);
  if (nativeSignal) {
    return { signal: nativeSignal, clear: noOp };
  }
  const fallback = fallbackTimeoutSignal(timeoutMs);
  if (fallback) {
    return fallback;
  }
  return { signal: undefined, clear: noOp };
}
