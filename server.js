'use strict';

require('dotenv').config();

const express = require('express');
const multer  = require('multer');
const { parse } = require('csv-parse');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// ─── App & Middleware ────────────────────────────────────────────────────────

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── PostgreSQL Pool ─────────────────────────────────────────────────────────

const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── PostgreSQL Pool ─────────────────────────────────────────────────────────

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'csv_dashboard',
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err.message);
});

// ─── Multer Setup ────────────────────────────────────────────────────────────

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename:    (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.originalname.toLowerCase().endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted.'));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derive a safe PostgreSQL table name from a filename.
 * e.g. "Sales Data-2024.csv" → "sales_data_2024"
 */
function fileNameToTableName(originalName) {
  return path.basename(originalName, path.extname(originalName))
    .toLowerCase()
    .replace(/[\s\-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^[^a-z_]+/, '_')   // ensure first char is letter or underscore
    .substring(0, 50);            // keep it short
}

/**
 * Derive a safe PostgreSQL column name from a CSV header string.
 */
function headerToColumnName(header) {
  return String(header)
    .toLowerCase()
    .replace(/[\s\-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^[^a-z_]+/, '_')
    || 'col';
}

/**
 * Detect the PostgreSQL type for an array of raw string values.
 * Tries INTEGER → FLOAT → TEXT.
 */
function detectType(values) {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== '');

  if (nonEmpty.length === 0) return 'TEXT';

  if (nonEmpty.every((v) => /^-?\d+$/.test(v.trim()))) return 'INTEGER';

  if (
    nonEmpty.every((v) =>
      /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(v.trim())
    )
  ) {
    return 'DOUBLE PRECISION';
  }

  return 'TEXT';
}

/**
 * Parse a CSV file into { headers, rows } where rows are arrays of strings.
 */
function parseCsvFile(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(
        parse({
          trim: true,
          skip_empty_lines: true,
          relax_column_count: true,
        })
      )
      .on('data', (row) => rows.push(row))
      .on('error', reject)
      .on('end', () => {
        if (rows.length === 0) {
          return reject(new Error('CSV file is empty.'));
        }
        const [headerRow, ...dataRows] = rows;
        resolve({ headers: headerRow, rows: dataRows });
      });
  });
}

/**
 * Check if a table already exists in the public schema.
 */
async function tableExists(client, tableName) {
  const result = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return result.rowCount > 0;
}

/**
 * Sanitise a name for safe inclusion in SQL identifiers (double-quote escape).
 */
function quoteIdent(name) {
  return `"${name.replace(/"/g, '""')}"`;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET / — serve the frontend
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST /upload — accept a CSV, create a table, insert rows
app.post('/upload', upload.single('csvfile'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const cleanup = () => {
    fs.unlink(file.path, () => {});
  };

  let client;
  try {
    // 1. Parse the CSV
    const { headers, rows } = await parseCsvFile(file.path);

    if (headers.length === 0) {
      cleanup();
      return res.status(400).json({ error: 'CSV has no headers.' });
    }

    // 2. Build column names & detect types
    const columnNames = headers.map(headerToColumnName);

    // Deduplicate column names (e.g. two empty headers both become "col")
    const seen = {};
    const safeColumns = columnNames.map((col) => {
      if (!seen[col]) {
        seen[col] = 1;
        return col;
      }
      seen[col] += 1;
      return `${col}_${seen[col]}`;
    });

    // Sample up to 200 rows for type detection
    const sample = rows.slice(0, 200);
    const colTypes = safeColumns.map((_, idx) =>
      detectType(sample.map((r) => r[idx]))
    );

    // 3. Determine final table name (handle collisions)
    let baseTableName = fileNameToTableName(file.originalname) || 'imported_table';
    client = await pool.connect();

    let tableName = baseTableName;
    if (await tableExists(client, tableName)) {
      tableName = `${baseTableName}_${Date.now()}`;
    }

    // 4. Build CREATE TABLE statement
    const columnDefs = safeColumns
      .map((col, idx) => `${quoteIdent(col)} ${colTypes[idx]}`)
      .join(', ');

    await client.query('BEGIN');

    await client.query(
      `CREATE TABLE ${quoteIdent(tableName)} (
         _id SERIAL PRIMARY KEY,
         ${columnDefs}
       )`
    );

    // 5. Bulk-insert rows using a parameterised query
    if (rows.length > 0) {
      const colList = safeColumns.map(quoteIdent).join(', ');
      const BATCH = 500;

      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH);
        const valuePlaceholders = [];
        const flatValues = [];
        let paramIdx = 1;

        for (const row of batch) {
          const placeholders = safeColumns.map((_, colIdx) => {
            const raw = row[colIdx];
            const val =
              raw === undefined || raw === '' ? null : raw;
            flatValues.push(val);
            return `$${paramIdx++}`;
          });
          valuePlaceholders.push(`(${placeholders.join(', ')})`);
        }

        await client.query(
          `INSERT INTO ${quoteIdent(tableName)} (${colList}) VALUES ${valuePlaceholders.join(', ')}`,
          flatValues
        );
      }
    }

    await client.query('COMMIT');

    // 6. Return a preview (first 100 rows)
    const preview = await client.query(
      `SELECT * FROM ${quoteIdent(tableName)} LIMIT 100`
    );

    cleanup();
    return res.json({
      message: 'CSV imported successfully.',
      tableName,
      rowsInserted: rows.length,
      columns: safeColumns,
      columnTypes: colTypes,
      preview: preview.rows,
    });
  } catch (err) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch (_) {}
    }
    cleanup();
    console.error('Upload error:', err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
});

// GET /tables — list all user tables
app.get('/tables', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );
    const tables = result.rows.map((r) => r.table_name);
    return res.json({ tables });
  } catch (err) {
    console.error('List tables error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /tables/:name — return first 100 rows of a table
app.get('/tables/:name', async (req, res) => {
  const { name } = req.params;

  // Validate: only allow safe identifier characters
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    return res.status(400).json({ error: 'Invalid table name.' });
  }

  const client = await pool.connect();
  try {
    const exists = await tableExists(client, name);
    if (!exists) {
      return res.status(404).json({ error: `Table "${name}" not found.` });
    }

    const result = await client.query(
      `SELECT * FROM ${quoteIdent(name)} LIMIT 100`
    );
    return res.json({ tableName: name, rows: result.rows });
  } catch (err) {
    console.error('Fetch table error:', err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// DELETE /tables/:name — drop a table
app.delete('/tables/:name', async (req, res) => {
  const { name } = req.params;

  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) {
    return res.status(400).json({ error: 'Invalid table name.' });
  }

  const client = await pool.connect();
  try {
    const exists = await tableExists(client, name);
    if (!exists) {
      return res.status(404).json({ error: `Table "${name}" not found.` });
    }

    await client.query(`DROP TABLE ${quoteIdent(name)}`);
    return res.json({ message: `Table "${name}" deleted successfully.` });
  } catch (err) {
    console.error('Delete table error:', err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─── Natural Language Command ────────────────────────────────────────────────

app.post('/api/command', async (req, res) => {
  const { command, resources, tasks } = req.body;
  if (!command) return res.status(400).json({ error: 'command is required.' });

  const system = `You are a Gantt chart assistant. Given a natural language command and the current project state, return a single JSON action object.

Available actions:
- { "type": "UPDATE_TASK",    "payload": { "id": "<task id>", "name"?: string, "startDate"?: "YYYY-MM-DD", "endDate"?: "YYYY-MM-DD", "percentComplete"?: number, "resourceIds"?: ["<resource id>"] } }
- { "type": "ADD_TASK",       "payload": { "name": string, "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "resourceIds"?: ["<resource id>"], "percentComplete"?: number } }
- { "type": "DELETE_TASK",    "payload": "<task id>" }
- { "type": "UPDATE_RESOURCE","payload": { "id": "<resource id>", "name"?: string, "role"?: string } }
- { "type": "ADD_RESOURCE",   "payload": { "name": string, "role"?: string } }
- { "type": "DELETE_RESOURCE","payload": "<resource id>" }
- { "type": "ERROR",          "message": "<why the command cannot be performed>" }

Rules:
- All dates must be in 2026 in YYYY-MM-DD format.
- Match task and resource names case-insensitively.
- Respond with ONLY the raw JSON object — no markdown, no explanation.`;

  const stateSnapshot = `Resources: ${JSON.stringify(resources.map(r => ({ id: r.id, name: r.name, role: r.role })))}
Tasks: ${JSON.stringify(tasks.map(t => ({ id: t.id, name: t.name, startDate: t.startDate, endDate: t.endDate, resourceIds: t.resourceIds, percentComplete: t.percentComplete })))}

Command: "${command}"`;

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system,
      messages: [{ role: 'user', content: stateSnapshot }],
    });

    let raw = msg.content[0].text.trim();
    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    let action;
    try {
      action = JSON.parse(raw);
    } catch {
      console.error('Raw model output:', raw);
      return res.status(500).json({ error: 'Model returned invalid JSON: ' + raw.slice(0, 120) });
    }
    return res.json({ action });
  } catch (err) {
    console.error('Command error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Global Error Handler ────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  console.error('Unhandled error:', err.message);
  return res.status(500).json({ error: err.message || 'Internal server error.' });
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`CSV Dashboard running at http://localhost:${PORT}`);
});
