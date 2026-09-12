# RaktCare Connect

Build Rakt-Link, an aesthetic, accessible, and simple-to-use web application prototype for India's National Sickle Cell Anaemia Elimination Mission (NSCAEM) following the attached specification prompt:

1. Module 1 — Confirmatory Test Follow-Up Tracker:
   - Patient intake and tracking dashboard for field-screened individuals awaiting confirmatory HPLC tests
   - Automatic overdue indicators at 7, 14, and 21 day thresholds with filtering and sorting
   - Simulated SMS/IVR reminder dispatch log with multi-language message templates (Hindi, Odia, Marathi, Gujarati, English)
   - Two-outcome closing workflow: 'confirmed_unverified' vs 'confirmed_documented' (with report slip reference and result: Non-carrier, Carrier, Disease)

2. Module 2 — Portable Continuity-of-Care Record:
   - Client-side QR code generation and camera QR scan/manual ID lookup
   - Enforce access rule: only patients with 'confirmed_documented' status can have care records
   - Mock ABHA ID integration point
   - Role-gated viewing (authenticated health worker vs unauthenticated preview)
   - Interactive offline-mode toggle with local caching and visible sync status on reconnect

3. Module 3 — Blood Donor Availability & Matching:
   - Restricted strictly to confirmed_documented patients with 'Disease' result
   - Blood request creation (ABO/Rh level, units, urgency, hospital) and donor registration
   - Transparent weighted priority scoring (compatibility, proximity, availability, response history)
   - Progressive notification simulation (Round 1 -> Round 2 -> Confirmed donor)
   - Hospital / blood bank dashboard with strict donor privacy (coarse location and availability only, no raw contact numbers)

4. Overall Experience:
   - Clean, calming, aesthetic healthcare UI with high-contrast, large touch targets suitable for low-connectivity/field tablets and phones
   - Language selector supporting English, Hindi, Odia, Marathi, and Gujarati
   - Pre-seeded realistic demo data across all 3 modules illustrating every workflow and edge case


## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

### Windows Quick Start

Double-click `start.bat` (or `run.bat`) in File Explorer to automatically check prerequisites, configure environment variables, install dependencies, and launch the development server at `http://localhost:8080`.

