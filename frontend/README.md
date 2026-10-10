# BIDGUARD AI

BIDGUARD AI is a premium government-tech frontend prototype for GeM procurement compliance, evidence mapping, and risk intelligence.

## Features

- Procurement assurance dashboard with compliance and risk trends
- Bid case creation and document upload workflow
- AI clause analysis and compliance matrix
- Risk alert triage, evidence drawer, reports, and audit trail
- Responsive layout with mobile navigation
- Loading, error, empty, and disabled states

## Tech stack

React, Vite, Tailwind CSS, React Router DOM, Lucide React, and Recharts.

## Structure

- `src/api/api.js` contains all mock API calls and sample data.
- `src/components/` contains shared layout and UI primitives.
- `src/pages/` contains route-level screens.

## Installation

```bash
npm install
npm run dev
```

## Mock API

The API service uses Promise delays to simulate a remote FastAPI service. Pages only call functions from `src/api/api.js`, so the UI contract can remain stable when replacing mock implementations.

## Connecting FastAPI later

Set `VITE_API_BASE_URL` in an environment file, then replace the service functions in `src/api/api.js` with `fetch` calls. Keep the existing function names and response shapes so components do not need to change.
