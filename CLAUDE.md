# Project: rent_front_app

## Stack
- Frontend: TypeScript
- Build: npm

## Security Requirements
- No hardcoded API keys, tokens, or secrets in source code
- All user inputs must be sanitized before rendering (XSS prevention)
- No inline event handlers with unsanitized data
- Dependencies must not have known CVEs
- No localStorage/sessionStorage for sensitive data (tokens, PII)
- CSP-compatible code (no inline scripts/styles where avoidable)
- Performance constraint: fixes must not increase bundle size >5%
