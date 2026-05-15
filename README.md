# RouteLog Pro

**Full-stack HOS trip planner for property-carrying truck drivers.**

RouteLog Pro takes a current location, pickup, and dropoff address and generates a fully compliant Hours of Service trip plan — complete with a route map, duty-status timeline, daily log sheets, fuel and rest stops, and a 70-hour cycle tracker.

---

## Features

- **HOS-compliant route planning** — 11-hour driving limit, 14-hour window, 30-min break, 10-hour rest, 70-hour cycle
- **Interactive route map** — OpenStreetMap tiles + React Leaflet with pickup/dropoff markers and route polyline
- **Duty-status timeline** — per-event breakdown with status colour coding (driving, on-duty, off-duty)
- **Printable 24-hour daily logs** — one card per day, matching ELD log format
- **Cycle tracker cards** — Current Cycle Used → Trip On-Duty Added → Ending Cycle Used → Cycle Remaining
- **Compliance summary** — applied rules checklist plus inline warnings (cycle reset, route issues)
- **Fuel stop scheduling** — automatic stop every 1,000 miles
- **Demo route presets** — one-click short / medium / long / fuel-test routes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, Django 6, Django REST Framework 3.17 |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Maps | React Leaflet 5, OpenStreetMap tiles |
| Geocoding | Nominatim (OpenStreetMap) |
| Routing | OSRM public API |
| Database | SQLite (development) |

---

## Assessment Requirements Covered

| Requirement | Implementation |
|---|---|
| Trip input form (current, pickup, dropoff, cycle hours) | `TripForm.tsx` |
| Route planning with HOS rules | `hos_calculator.py` — `HosPlanner` class |
| REST API endpoint | `POST /api/trips/plan/` |
| Route map | `RouteMap.tsx` — React Leaflet |
| Duty-status timeline | `TripTimeline.tsx` |
| Daily log sheets | `DailyLogsSection.tsx` |
| Compliance warnings | `HosComplianceSummary.tsx` + `cycle_issue` field |
| 70-hour cycle tracking | `SummaryCards.tsx` — four cycle cards |
| Fuel stop rule | `drive_leg()` — every 1,000 miles |

---

## HOS Rules Implemented

| Rule | Value |
|---|---|
| Maximum daily driving | 11 hours |
| Maximum daily on-duty window | 14 hours |
| Mandatory break after driving | 30 minutes after 8 cumulative driving hours |
| Daily off-duty rest | 10 hours |
| Weekly cycle limit | 70 hours / 8 days |
| Cycle reset | 34 hours off-duty |
| Pickup time (on-duty) | 1 hour |
| Dropoff time (on-duty) | 1 hour |
| Fuel stop interval | Every 1,000 miles (0.5 hour on-duty) |

---

## Screens & Demo

| Screen | Description |
|---|---|
| **Planner form** | Enter current location, pickup, dropoff, and current 70-hour cycle hours used. Use demo route pills to pre-fill values. |
| **Trip Overview cards** | Nine summary cards: Total Miles, Drive Hours, Elapsed Hours, Fuel Stops, Daily Rests, Current Cycle Used, Trip On-Duty Added, Ending Cycle Used, Cycle Remaining. |
| **Compliance Logic** | Applied HOS rules checklist. Amber warning banner if a cycle reset or route issue was detected. |
| **Route & Duty Timeline** | Left: interactive map with route polyline, markers, and event popups. Right: scrollable event list with duration, status, and location. |
| **Daily Driver Logs** | Tabbed per-day cards in 24-hour ELD format with colour-coded duty-status bars and hourly totals. |

> **Location input tip:** Use `City, State` format (e.g. `Dallas, TX`) for best geocoding accuracy. Full addresses or ZIP codes may work but can produce unexpected routing results with the free Nominatim/OSRM APIs.

---

## Backend Setup

**Requirements:** Python 3.12+

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # macOS/Linux
venv\Scripts\activate             # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file and edit as needed
cp .env.example .env

# Run database migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000`.

---

## Frontend Setup

**Requirements:** Node.js 18+

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file and edit as needed
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Default | Required | Description |
|---|---|---|---|
| `SECRET_KEY` | — | Yes (prod) | Django secret key. Generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | `True` | No | Set to `False` in production |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | No | Comma-separated allowed hostnames |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | No | Comma-separated frontend origins |
| `GEOCODING_URL` | Nominatim public API | No | Override geocoding endpoint |
| `ROUTING_URL` | OSRM public API | No | Override routing endpoint |
| `ROUTE_API_KEY` | — | No | API key for routing service (not required for public OSRM) |

> **Note:** `settings.py` currently uses hardcoded development defaults. For production, wire `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, and `CORS_ALLOWED_ORIGINS` through `os.getenv()`.

### Frontend — `frontend/.env`

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | Backend base URL used by the API client |

---

## API Endpoint

### `POST /api/trips/plan/`

**Request body (JSON):**

```json
{
  "current_location": "Dallas, TX",
  "pickup_location": "Austin, TX",
  "dropoff_location": "Atlanta, GA",
  "current_cycle_used": 10.0
}
```

| Field | Type | Constraints | Description |
|---|---|---|---|
| `current_location` | string | max 255 chars | Driver's starting position |
| `pickup_location` | string | max 255 chars | Pickup stop |
| `dropoff_location` | string | max 255 chars | Final delivery destination |
| `current_cycle_used` | float | 0 – 70 | Hours already used in the current 70-hour cycle |

**Response (200 OK) — abbreviated:**

```json
{
  "route_summary": { "total_miles": 1247, "estimated_drive_hours": 20.8, "legs": [...], "route_coordinates": [...] },
  "trip_summary": {
    "total_on_duty_hours": 23.5,
    "ending_cycle_used_hours": 33.5,
    "cycle_remaining_hours": 36.5,
    "fuel_stops": 1,
    "daily_rests": 2,
    "cycle_issue": null
  },
  "event_timeline": [...],
  "daily_logs": [...]
}
```

**Error responses:**

| Status | Code | Meaning |
|---|---|---|
| 400 | `geocoding_failed` | Location could not be geocoded |
| 400 | `routing_failed` | Route between locations could not be calculated |
| 400 | (validation) | Missing or invalid request fields |

---

## Running Tests

```bash
# Backend (from repo root)
backend/venv/Scripts/python.exe backend/manage.py test trips   # Windows
# or
cd backend && python manage.py test trips                       # macOS/Linux

# Frontend
cd frontend && npm run lint && npm run build
```

---

## Deployment Notes

- **Backend:** Set `DEBUG=False`, provide a strong `SECRET_KEY`, restrict `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`. Swap SQLite for PostgreSQL for multi-worker deployments. Add `gunicorn` or `uvicorn` as the WSGI server.
- **Frontend:** Run `npm run build` — the `dist/` folder is a static site that can be hosted on Netlify, Vercel, or any CDN. Set `VITE_API_BASE_URL` to the deployed backend URL before building.
- **CORS:** The backend must list the frontend origin in `CORS_ALLOWED_ORIGINS`. The dev default (`CORS_ALLOW_ALL_ORIGINS = True`) must be disabled in production.
- **Free API rate limits:** Nominatim enforces a 1 req/s rate limit and requires a `User-Agent` header identifying your app. The OSRM demo server is for low-volume use only. For production traffic, self-host OSRM or switch to a commercial routing provider.

---

## Known Assumptions & Limitations

- **Property-carrying driver rules only** — passenger-carrying, team driving, and short-haul exemptions are not modelled.
- **Single-driver, single-trip** — no multi-stop dispatch or relay driving.
- **Speed assumed constant at 60 mph** — actual drive time will differ.
- **Cycle tracking is per-trip** — the planner does not persist prior trip history; the user must enter their current cycle hours manually.
- **No sleeper berth** — the 8/2 split sleeper berth provision is not implemented.
- **City/State input recommended** — full street addresses work but geocoding accuracy varies with the public Nominatim API.
- **SQLite** — suitable for development and single-process deployment only.

---

## Delivery Checklist

- [ ] GitHub repository pushed and set to public (or shared with reviewer)
- [ ] All tests pass: `python manage.py test trips`
- [ ] Frontend builds cleanly: `npm run lint && npm run build`
- [ ] Demo routes work end-to-end (Short, Medium, Long, Fuel Test)
- [ ] Compliance warnings display correctly for a 65-hour starting cycle trip
- [ ] Daily logs render and match the event timeline
- [ ] Loom walkthrough recorded (planner form → map → timeline → logs)
- [ ] Hosted demo URL included in repository description (optional)
