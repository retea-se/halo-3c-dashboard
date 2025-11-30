# Testing Guide - Halo 3C Dashboard

## Översikt

Projektet har tre nivåer av tester:
1. **Backend Unit Tests** - pytest-baserade tester för services och logik
2. **Backend Integration Tests** - API endpoint-tester
3. **Frontend E2E Tests** - Playwright-baserade end-to-end tester
4. **Visual Regression Tests** - Screenshot-baserade visuella tester

---

## Backend Tests

### Setup

Backend-tester använder `pytest` och finns i `tests/backend/`.

**Installera test-dependencies:**
```bash
cd src/backend
pip install -r requirements.txt  # Inkluderar pytest
```

### Kör Backend Tests

```bash
# Kör alla backend-tester
cd tests/backend
pytest

# Kör specifik test-fil
pytest test_event_service.py

# Kör med verbose output
pytest -v

# Kör med coverage
pytest --cov=src/backend --cov-report=html
```

### Teststruktur

```
tests/backend/
├── conftest.py           # Pytest fixtures och konfiguration
├── pytest.ini            # Pytest konfiguration
├── test_event_service.py # EventService unit tests
├── test_sensor_service.py # SensorService unit tests
├── test_beacon_service.py # BeaconService unit tests
├── test_halo_client.py   # HaloClient unit tests
└── test_api_endpoints.py # API endpoint integration tests
```

### Test Fixtures

**conftest.py** innehåller återanvändbara fixtures:
- `mock_influxdb_service` - Mockad InfluxDB service
- `mock_halo_client` - Mockad Halo client
- `sample_sensor_data` - Sample sensor data
- `sample_beacon_data` - Sample beacon data
- `sample_event_data` - Sample event data

### Exempel: Skriv en Backend Test

```python
# tests/backend/test_my_service.py
import pytest
from services.my_service import MyService

class TestMyService:
    def test_my_method(self):
        service = MyService()
        result = service.my_method()
        assert result is not None
```

---

## Frontend E2E Tests

### Setup

Frontend E2E-tester använder `Playwright` och finns i `tests/frontend/e2e/`.

**Installera Playwright:**
```bash
cd tests/frontend/e2e
npm install
npx playwright install
```

### Kör Frontend E2E Tests

```bash
# Kör alla E2E-tester
npm test

# Kör med UI mode
npm run test:ui

# Kör i headed mode (visar webbläsare)
npm run test:headed

# Kör specifik test-fil
npx playwright test tests/dashboard.spec.ts

# Kör visual regression tests
npm run test:visual
```

### Teststruktur

```
tests/frontend/e2e/
├── playwright.config.ts  # Playwright konfiguration
├── package.json          # Test dependencies
├── tsconfig.json         # TypeScript config
└── tests/
    ├── dashboard.spec.ts # Dashboard E2E tests
    ├── events.spec.ts    # Events page E2E tests
    └── visual.spec.ts    # Visual regression tests
```

### Playwright Configuration

**playwright.config.ts** konfigurerar:
- Base URL: `http://localhost:3000`
- Web servers: Automatisk start av dev server
- Browsers: Chromium, Firefox, WebKit
- Screenshots: Vid failure
- Trace: Vid retry

### Exempel: Skriv en E2E Test

```typescript
// tests/frontend/e2e/tests/my-page.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My Page', () => {
  test('should display content', async ({ page }) => {
    await page.goto('/my-page');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

---

## Visual Regression Tests

Visual regression-tester används för att säkerställa att UI inte förändras oväntat.

### Kör Visual Tests

```bash
cd tests/frontend/e2e
npm run test:visual
```

### Screenshot Comparison

Screenshots sparas i `tests/frontend/e2e/test-results/` och jämförs automatiskt med baseline.

**Första körningen:**
- Skapar baseline screenshots
- Alla tester passerar

**Senare körningar:**
- Jämför med baseline
- Flaggar ändringar som failures
- Uppdatera baseline med: `npx playwright test --update-snapshots`

### Testa Light/Dark Mode

Visual tests körs i både light och dark mode för att säkerställa att båda teman fungerar korrekt.

---

## CI/CD Integration

### GitHub Actions Exempel

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
      - run: cd src/backend && pip install -r requirements.txt
      - run: cd tests/backend && pytest

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd tests/frontend/e2e && npm install && npx playwright install
      - run: cd tests/frontend/e2e && npm test
```

---

## Mocking och Test Data

### Backend Mocking

Backend-tester mockar:
- **InfluxDB** - För att undvika databas-beroenden
- **Halo Client** - För att undvika nätverksanrop
- **External APIs** - För isolerade tester

### Frontend Mocking

Frontend E2E-tester:
- Använder riktig backend (dev server)
- Eller mock API via Playwright route interception
- Testar mot lokalhost

---

## Best Practices

### Backend Tests

1. **Isolera tester** - Varje test ska vara oberoende
2. **Använd fixtures** - Återanvänd test data och mocks
3. **Test edge cases** - Testa error handling och gränsvärden
4. **Snabb execution** - Undvik långsamma operationer

### Frontend E2E Tests

1. **Vänta på element** - Använd `waitForSelector` för async operations
2. **Unika selektorer** - Använd data-testid för stabila selektorer
3. **Reset state** - Säkerställ ren state mellan tester
4. **Isolera tester** - Varje test ska vara oberoende

### Visual Regression

1. **Baseline management** - Committa baseline screenshots
2. **Review changes** - Granska visuella ändringar noggrant
3. **Update snapshots** - Uppdatera när ändringar är intentionella
4. **Cross-browser** - Testa i alla browsers

---

## Troubleshooting

### Backend Tests

**Problem:** Tests failar med import errors
**Lösning:** Kontrollera PYTHONPATH och att src/backend är i path

**Problem:** Mock fungerar inte
**Lösning:** Kontrollera patch-path matchar import-path exakt

### Frontend E2E Tests

**Problem:** Tests timeout
**Lösning:** Öka timeout i playwright.config.ts eller använd explicit waits

**Problem:** Selectors hittas inte
**Lösning:** Använd Playwright's codegen: `npx playwright codegen http://localhost:3000`

**Problem:** Visual tests failar
**Lösning:** Review screenshot differences och uppdatera baseline om ändringar är korrekta

---

## Nästa Steg

- [ ] Lägg till fler backend unit tests
- [ ] Utöka E2E test coverage
- [ ] Lägg till performance tests
- [ ] CI/CD integration
- [ ] Test coverage reporting

---

**Senast uppdaterad:** 2025-01-27


