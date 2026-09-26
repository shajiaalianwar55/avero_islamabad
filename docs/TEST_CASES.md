# Test cases

## Unit
- Emergency electrical → Emergency / stop troubleshooting
- Safe AC filter → DIY
- Sink leak → Technician
- Missing warranty → null
- Deterministic offer ranking badges
- Warranty remaining days

## Playwright (critical paths)
1. incident → technician → offer → booking → repair → history
2. incident → DIY → resolved
3. incident → DIY → escalated
4. incident → emergency
5. repeat incident → warranty alert
6. provider submits offer
7. extra charge requires approval
8. demo reset

Run: `npm test` (unit). E2E: `npx playwright test` after `npx playwright install`.
