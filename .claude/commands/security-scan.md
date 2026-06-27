# Security Scan Agent

Perform a comprehensive security audit of this frontend project.

## Scan Steps

1. **Secrets Detection**
   - Search all files for hardcoded API keys, tokens, passwords
   - Check .env files are in .gitignore
   - Flag any credentials in JS/TS/HTML/CSS files

2. **XSS Vulnerabilities**
   - Find all instances of dangerouslySetInnerHTML (React) or v-html (Vue)
   - Check that user input is sanitized before DOM insertion
   - Verify no unsanitized URL parameters are rendered

3. **Dependency Audit**
   - Run `npm audit` and report critical/high vulnerabilities
   - Check for outdated packages with known CVEs
   - Flag unused dependencies that increase attack surface

4. **Auth & Data Handling**
   - Verify tokens are not stored in localStorage
   - Check CORS configuration if present
   - Ensure sensitive data is not logged to console

5. **Insecure Patterns**
   - eval(), Function(), innerHTML with user data
   - window.location manipulation with unvalidated input
   - postMessage without origin validation
   - Open redirects

## Output Format
For each finding:
- **Severity**: Critical / High / Medium / Low
- **File**: path and line number
- **Issue**: what's wrong
- **Fix**: suggest a patch

## Constraints
- Do NOT add heavy sanitization libraries if native browser APIs suffice
- Fixes must not increase page load time
- Prefer fixing inline over adding new dependencies

After listing findings, ask me which ones to fix, then implement the fixes.