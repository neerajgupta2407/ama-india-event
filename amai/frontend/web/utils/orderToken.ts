const key = (reference: string) => `amai-order-${reference}`;

/** The order token lives only in this tab's sessionStorage. Storage can be blocked, so every call is guarded. */
export function saveOrderToken(reference: string, token: string) {
  try {
    sessionStorage.setItem(key(reference), token);
  } catch {
    /* the status page then asks the visitor to check their email */
  }
}

export function readOrderToken(reference: string): string | null {
  try {
    return sessionStorage.getItem(key(reference));
  } catch {
    return null;
  }
}
