// pantry.js — secure proxy between your app and GitHub
// Runs server-side on Netlify. Your GITHUB_TOKEN never touches the browser.

exports.handler = async (event) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const TOKEN = process.env.GITHUB_TOKEN;
  const REPO  = process.env.GITHUB_REPO;   // e.g. "ryanjones/pantry"
  const FILE  = 'pantry.json';
  const API   = `https://api.github.com/repos/${REPO}/contents/${FILE}`;

  const ghHeaders = {
    'Authorization': `token ${TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'PantryApp/1.0',
  };

  try {
    // ── READ ──────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      const res  = await fetch(API, { headers: ghHeaders });
      const data = await res.json();

      if (!res.ok) {
        return {
          statusCode: res.status,
          headers: { ...CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: data.message }),
        };
      }

      // GitHub returns content as base64
      const json = Buffer.from(data.content, 'base64').toString('utf-8');
      return {
        statusCode: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: json,
      };
    }

    // ── WRITE ─────────────────────────────────────────────────────────────────
    if (event.httpMethod === 'PUT') {
      // Step 1: get current SHA (required by GitHub API to update a file)
      const getRes  = await fetch(API, { headers: ghHeaders });
      const getData = await getRes.json();

      if (!getRes.ok) {
        return {
          statusCode: getRes.status,
          headers: { ...CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: getData.message }),
        };
      }

      const sha = getData.sha;

      // Step 2: base64-encode the new content and push
      const newContent = Buffer.from(event.body, 'utf-8').toString('base64');
      const putRes = await fetch(API, {
        method: 'PUT',
        headers: ghHeaders,
        body: JSON.stringify({
          message: `Pantry update ${new Date().toISOString()}`,
          content: newContent,
          sha: sha,
        }),
      });

      const putData = await putRes.json();

      if (!putRes.ok) {
        return {
          statusCode: putRes.status,
          headers: { ...CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: putData.message }),
        };
      }

      return {
        statusCode: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true }),
      };
    }

    return { statusCode: 405, headers: CORS, body: 'Method not allowed' };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
