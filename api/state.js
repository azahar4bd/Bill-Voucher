const NEON_API_BASE = 'https://console.neon.tech/api/v2';
let cachedConnectionString = '';

async function neonApi(path, apiKey) {
  const response = await fetch(`${NEON_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Neon API ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

/** DATABASE_URL is preferred; otherwise derive it from the server-only Neon API key. */
async function getConnectionString() {
  const direct = process.env.DATABASE_URL || '';
  if (direct && !direct.startsWith('REPLACE_')) return direct;
  if (cachedConnectionString) return cachedConnectionString;

  const apiKey = process.env.NEON_API_KEY || '';
  if (!apiKey) throw new Error('DATABASE_URL / NEON_API_KEY is not configured');

  const projects = await neonApi('/projects', apiKey);
  const project = projects.projects?.[0];
  const projectId = process.env.NEON_PROJECT_ID || project?.id;
  if (!projectId) throw new Error('no Neon project found for this API key');

  const branches = await neonApi(`/projects/${encodeURIComponent(projectId)}/branches`, apiKey);
  const branch =
    branches.branches?.find((b) => b.name === (process.env.NEON_BRANCH || 'main')) ||
    branches.branches?.[0];
  const branchId = branch?.id;
  if (!branchId) throw new Error('no Neon branch found');

  const details = await neonApi(
    `/projects/${encodeURIComponent(projectId)}/branches/${encodeURIComponent(branchId)}`,
    apiKey
  );
  const database =
    process.env.NEON_DATABASE || details.databases?.[0]?.name || 'neondb';
  const role =
    process.env.NEON_ROLE || details.roles?.[0]?.name || 'neondb_owner';

  const params = new URLSearchParams({
    branch_id: branchId,
    database_name: database,
    role_name: role,
    pooled: 'true',
  });
  const uriResult = await neonApi(
    `/projects/${encodeURIComponent(projectId)}/connection_uri?${params.toString()}`,
    apiKey
  );
  if (!uriResult.uri) throw new Error('Neon API returned no connection URI');

  cachedConnectionString = uriResult.uri;
  return cachedConnectionString;
}

async function getConnectionConfig() {
  const connectionString = await getConnectionString();
  const url = new URL(connectionString);
  const endpointHost = url.hostname.replace(/^[^.]+/, 'api');
  return {
    connectionString,
    endpoint: `https://${endpointHost}/sql`,
  };
}

async function query(sql, params = []) {
  const config = await getConnectionConfig();

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': config.connectionString,
      'Neon-Raw-Text-Output': 'true',
      'Neon-Array-Mode': 'true',
    },
    body: JSON.stringify({ query: sql, params }),
  });

  if (!response.ok) {
    throw new Error(`Neon HTTP ${response.status}: ${await response.text()}`);
  }

  const result = await response.json();
  const fields = (result.fields || []).map((field) => field.name);
  return (result.rows || []).map((row) =>
    Object.fromEntries(row.map((value, index) => [fields[index], value])),
  );
}

const ALLOWED_ORIGINS = [
  'https://azahar4bd.github.io',
  'http://localhost:3000',
];

function applyCors(req, res) {
  const origin = req.headers.origin || '';
  const isLocal = /^http:\/\/localhost(:\d+)?$/.test(origin);
  const allowed = ALLOWED_ORIGINS.includes(origin) || isLocal;
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

function readCode(req) {
  const raw = req.query?.code ?? req.body?.code ?? '';
  const code = String(raw).trim();
  return /^[A-Za-z0-9_-]{4,64}$/.test(code) ? code : null;
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const code = readCode(req);
  if (!code) {
    return res.status(400).json({ error: 'invalid_code' });
  }

  const hasDirectUrl =
    process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('REPLACE_');
  if (!hasDirectUrl && !process.env.NEON_API_KEY) {
    return res.status(503).json({ error: 'database_not_configured' });
  }

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS app_state (
        workspace_code text PRIMARY KEY,
        payload jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    if (req.method === 'GET') {
      const rows = await query(
        'SELECT payload, updated_at FROM app_state WHERE workspace_code = $1',
        [code],
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'not_found' });
      }
      const stored = rows[0].payload;
      return res.status(200).json({
        payload: typeof stored === 'string' ? JSON.parse(stored) : stored,
        updatedAt: rows[0].updated_at,
      });
    }

    if (req.method === 'POST') {
      const payload = req.body?.payload;
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return res.status(400).json({ error: 'invalid_payload' });
      }

      const serialized = JSON.stringify(payload);
      if (serialized.length > 1_000_000) {
        return res.status(413).json({ error: 'payload_too_large' });
      }

      await query(
        `INSERT INTO app_state (workspace_code, payload, updated_at)
         VALUES ($1, $2::jsonb, now())
         ON CONFLICT (workspace_code) DO UPDATE
         SET payload = EXCLUDED.payload, updated_at = now()`,
        [code, serialized],
      );

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (error) {
    console.error('sync error', error);
    return res.status(500).json({ error: 'database_error' });
  }
}
