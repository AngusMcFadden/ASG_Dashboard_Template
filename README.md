# CSV Dashboard

A Node.js/Express web application that lets you upload CSV files and explore them as PostgreSQL tables through a clean browser UI.

---

## Features

- Drag-and-drop or file-picker CSV upload (up to 100 MB)
- Automatic column-type detection (INTEGER, DOUBLE PRECISION, TEXT)
- Table names derived from filenames; timestamp suffix added on collision
- Live upload progress bar
- Sidebar listing all imported tables with one-click preview
- Delete tables with a confirmation dialog
- Proper JSON error responses throughout

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | >= 18.x |
| npm | >= 9.x |
| PostgreSQL | >= 13 |

---

## Quick Start

### 1. Clone / enter the project directory

```bash
cd /path/to/ASG_Dashboard_Template
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the environment

Copy the example env file and fill in your PostgreSQL credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=csv_dashboard
PORT=3000
```

### 4. Create the database

Connect to PostgreSQL and run:

```sql
CREATE DATABASE csv_dashboard;
```

> The application creates tables on-demand; no schema migrations are required.

### 5. Start the server

```bash
npm start
```

Open your browser at **http://localhost:3000**.

For development with auto-restart:

```bash
npm run dev
```

---

## Project Structure

```
ASG_Dashboard_Template/
├── public/
│   └── index.html        # Frontend (single-page, no framework)
├── uploads/              # Temporary storage for incoming CSV files
│                         # (auto-created; files deleted after import)
├── .env.example          # Environment variable template
├── .gitignore
├── package.json
├── README.md
└── server.js             # Express application
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Serve the frontend |
| `POST` | `/upload` | Upload a CSV (`multipart/form-data`, field `csvfile`) |
| `GET` | `/tables` | List all user tables |
| `GET` | `/tables/:name` | Return first 100 rows of a table as JSON |
| `DELETE` | `/tables/:name` | Drop a table |

### POST /upload — response body

```json
{
  "message": "CSV imported successfully.",
  "tableName": "sales_data",
  "rowsInserted": 1500,
  "columns": ["id", "name", "amount"],
  "columnTypes": ["INTEGER", "TEXT", "DOUBLE PRECISION"],
  "preview": [ { "_id": 1, "id": 1, "name": "Alice", "amount": 9.99 } ]
}
```

---

## Naming Rules

- **Table names** — filename (no extension) lowercased; spaces and hyphens replaced with underscores; non-alphanumeric characters removed; truncated to 50 characters. If a table with that name already exists a Unix-timestamp suffix is appended.
- **Column names** — same transformation applied to each CSV header value.
- A `_id SERIAL PRIMARY KEY` column is always added as the first column.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `ECONNREFUSED` on startup | PostgreSQL is not running or credentials in `.env` are wrong |
| `database "csv_dashboard" does not exist` | Run `CREATE DATABASE csv_dashboard;` in psql |
| Upload returns 400 "Only CSV files are accepted" | Ensure the file has a `.csv` extension |
| Columns all detected as TEXT | The column contains mixed or non-numeric data — this is expected |
