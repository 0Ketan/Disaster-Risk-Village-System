import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import axios from 'axios';

test('Mock Server: POST /api/refresh success response payload handling', async () => {
  const mockDynamicData = {
    villages: [
      {
        id: 1,
        name: "Malpa",
        district: "Pithoragarh",
        latitude: 30.12,
        longitude: 79.45,
        population: 850,
        risk_score: 88.5,
        base_risk_score: 72.0,
        live_rainfall_mm: 8.25,
        risk_level: "Critical",
        priority: "Immediate",
        relocation_required: true,
        dynamic_modifier_applied: true,
        _source: "live_refresh"
      }
    ],
    total_villages: 1,
    critical_count: 1,
    last_updated: "2026-08-30T08:00:00Z",
    _source: "live_refresh"
  };

  const server = http.createServer((req, res) => {
    if (req.url === '/api/refresh' && req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockDynamicData));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const client = axios.create({ baseURL: `http://127.0.0.1:${port}`, timeout: 2000 });

  const response = await client.post('/api/refresh');
  assert.equal(response.status, 200);
  assert.equal(response.data.villages.length, 1);
  assert.equal(response.data.villages[0].risk_level, 'Critical');
  assert.equal(response.data.villages[0].risk_score, 88.5);
  assert.equal(response.data.villages[0].live_rainfall_mm, 8.25);
  assert.equal(response.data.critical_count, 1);
  assert.equal(response.data._source, 'live_refresh');

  await new Promise((resolve) => server.close(resolve));
});

test('Mock Server: POST /api/refresh fallback 500 error handling', async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/api/refresh') {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ detail: 'Open-Meteo simulated failure' }));
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const client = axios.create({ baseURL: `http://127.0.0.1:${port}`, timeout: 2000 });

  let failed = false;
  try {
    await client.post('/api/refresh');
  } catch (err) {
    failed = true;
    assert.equal(err.response?.status, 500);
  }
  assert.ok(failed, 'Client must catch 500 and allow App.jsx to trigger fallback toast');

  await new Promise((resolve) => server.close(resolve));
});
