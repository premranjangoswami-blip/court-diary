# Court Diary — Advocate Management System

A full-stack web application for managing court cases, parties, and hearing dates in a lawyer's office.

---

## Features

| Feature | Details |
|---|---|
| Case Management | Add / Edit / Delete / View cases with full details |
| Hearing Management | Multiple hearings per case, full history, mark complete |
| Dashboard | Today's, tomorrow's, and upcoming (7-day) hearings + stat cards |
| Search | Search by case number, party name, or mobile number |
| Reminders | 7-day hearing reminder list with urgency labels |
| Call Party | `tel:` link opens device dialer — architecture ready for Twilio/Exotel |
| Bilingual UI | Hindi / English labels throughout |
| Responsive | Works on mobile and desktop |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · React Router v6 · Tailwind CSS · Vite |
| Backend | Node.js · Express 4 |
| Database | SQLite via sql.js (pure JS, no native build tools needed) |
| Validation | express-validator |
| API Tests | Jest + Supertest |
| UI Tests | Vitest + Testing Library |

---

## Prerequisites

- **Node.js** v18 or newer
- **npm** v9 or newer
- No Visual Studio or C++ compiler required

---

## Installation

```bash
# 1. Clone / download the project
cd "court diary"

# 2. Install server dependencies
npm install

# 3. Install client dependencies
npm install --prefix client
```

---

## Running the Application

### Development (two terminals)

**Terminal 1 — API server (port 5000)**
```bash
npm run server
```

**Terminal 2 — React dev server (port 3000)**
```bash
npm run client
```

Then open **http://localhost:3000** in your browser.

### Using concurrently (single command)
```bash
npm run dev
```

### Production build
```bash
# Build the React app
npm run build --prefix client

# Serve everything from the Express server
NODE_ENV=production npm run server
# Open http://localhost:5000
```

---

## Database

The SQLite database is stored as `court_diary.db` in the project root. It is created automatically on first run. No setup required.

**Tables:**
- `cases` — all case records
- `hearings` — hearing records linked to cases (cascade deletes)

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/cases` | List all cases (optional `?status=Active`) |
| POST | `/api/cases` | Create a case |
| GET | `/api/cases/:id` | Get a single case |
| PUT | `/api/cases/:id` | Update a case |
| DELETE | `/api/cases/:id` | Delete a case + all its hearings |
| GET | `/api/cases/:id/hearings` | List hearings for a case |
| POST | `/api/cases/:id/hearings` | Add a hearing to a case |
| PUT | `/api/hearings/:id` | Update a hearing |
| DELETE | `/api/hearings/:id` | Delete a hearing |
| GET | `/api/dashboard` | Dashboard counts + hearing lists |
| GET | `/api/search?q=` | Search cases |
| GET | `/api/reminders` | Upcoming hearings (next 7 days) |

---

## Running Tests

### API tests (Jest + Supertest)
```bash
npm run test:server
```

### Frontend component tests (Vitest)
```bash
npm test --prefix client
```

---

## Project Structure

```
court diary/
├── server/
│   ├── index.js              # Express entry point
│   ├── db.js                 # sql.js SQLite wrapper + migrations
│   ├── routes/
│   │   ├── cases.js          # Cases CRUD + hearings sub-resource
│   │   ├── hearings.js       # Standalone hearing PUT/DELETE
│   │   ├── dashboard.js      # Dashboard stats + hearing lists
│   │   ├── search.js         # Global search
│   │   └── reminders.js      # 7-day reminder list
│   ├── middleware/
│   │   ├── errorHandler.js   # Global error handler
│   │   └── validate.js       # express-validator result handler
│   ├── services/
│   │   └── phoneService.js   # Telephony abstraction (tel: → future Twilio)
│   └── tests/
│       └── api.test.js       # Jest + Supertest integration tests
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Cases.jsx
│   │   │   ├── AddEditCase.jsx
│   │   │   ├── CaseDetail.jsx
│   │   │   ├── Search.jsx
│   │   │   └── Reminders.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx        # Sidebar + bottom nav
│   │   │   ├── HearingForm.jsx   # Add/Edit hearing modal
│   │   │   ├── HearingHistory.jsx
│   │   │   ├── CallPartyButton.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── Spinner.jsx
│   │   │   ├── ErrorAlert.jsx
│   │   │   └── ConfirmDialog.jsx
│   │   ├── services/
│   │   │   ├── api.js           # Axios wrapper
│   │   │   └── phoneService.js  # Client-side tel: abstraction
│   │   └── utils/
│   │       └── dateUtils.js
│   └── vite.config.js
├── package.json
├── court_diary.db             # Created automatically on first run
└── README.md
```

---

## Adding a Telephony Provider (Future)

The `phoneService` is isolated in:
- `server/services/phoneService.js` — server-side
- `client/src/services/phoneService.js` — client-side

To integrate Twilio, Exotel, or any other provider, replace `getDialUri()` / `dial()` with your API call. No component or route code needs to change.

---

## Case Fields

| Field | Required | Notes |
|---|---|---|
| Case Number | ✅ | Unique identifier e.g. CC/123/2024 |
| Case Type | ✅ | Criminal, Civil, Family, etc. |
| Court Name | ✅ | |
| Police Station | | Optional |
| GR Number | | Government Register number |
| Party / Client Name | ✅ | |
| Opposite Party | | |
| Party Mobile | | Used for Call Party button |
| Advocate Name | | |
| Status | | Active / Disposed / Stayed |
| Notes | | Free text |

---

## License

MIT — for private law office use.
