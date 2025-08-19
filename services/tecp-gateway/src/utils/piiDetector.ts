/*
 * TECP Gateway - PII Detection and Redaction
 */

export class PIIDetector {
  private readonly patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    // Medical record numbers, patient IDs, etc.
    medicalId: /\b(MRN|Patient ID|Medical Record)[\s:]+[\w\d-]+/gi,
    // Financial account numbers
    accountNumber: /\b(Account|Acct)[\s#:]+[\d-]+/gi
  };

  detectPII(text: string): boolean {
    for (const [type, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }

  redactPII(text: string): string {
    let redacted = text;
    
    redacted = redacted.replace(this.patterns.email, '[EMAIL_REDACTED]');
    redacted = redacted.replace(this.patterns.phone, '[PHONE_REDACTED]');
    redacted = redacted.replace(this.patterns.ssn, '[SSN_REDACTED]');
    redacted = redacted.replace(this.patterns.creditCard, '[CARD_REDACTED]');
    redacted = redacted.replace(this.patterns.ipAddress, '[IP_REDACTED]');
    redacted = redacted.replace(this.patterns.medicalId, '[MEDICAL_ID_REDACTED]');
    redacted = redacted.replace(this.patterns.accountNumber, '[ACCOUNT_REDACTED]');
    
    return redacted;
  }

  getPIITypes(text: string): string[] {
    const detected: string[] = [];
    
    for (const [type, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(text)) {
        detected.push(type);
      }
    }
    
    return detected;
  }
}
