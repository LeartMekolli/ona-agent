import { Injectable } from '@nestjs/common';
import { PrivacySession, type KnownIdentity } from './privacy-session';

@Injectable()
export class PrivacyService {
  createSession(identities: readonly KnownIdentity[]): PrivacySession {
    return new PrivacySession(identities);
  }

  /** Extra redaction for trace payloads, applied on top of pseudonymization. */
  sanitizeForTrace(value: unknown): unknown {
    if (typeof value !== 'string') return value;
    return value.replace(
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      '[REDACTED_CARD]',
    );
  }
}
