import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Import modules from frontend src
import { FALLBACK_VILLAGES, refreshVillages, getVillages } from '../src/api/villages.js';
import { getRiskColor, getRiskLevel, getMarkerRadius } from '../src/utils/risk_math.js';

test('1. FALLBACK_VILLAGES Integrity & Structure', () => {
  assert.ok(Array.isArray(FALLBACK_VILLAGES), 'FALLBACK_VILLAGES must be an array');
  assert.ok(FALLBACK_VILLAGES.length >= 10, 'Must have realistic fallback village count');
  for (const v of FALLBACK_VILLAGES) {
    assert.ok(v.id !== undefined, 'Village must have id');
    assert.ok(v.name, 'Village must have name');
    assert.ok(v.risk_score !== undefined, 'Village must have risk_score');
    assert.ok(v.risk_level, 'Village must have risk_level');
  }
});

test('2. refreshVillages Fallback Graceful Handling on Network Error', async () => {
  // When no backend server is running or network fails, refreshVillages must return fallback data without throwing
  const result = await refreshVillages();
  assert.ok(result, 'Result must exist');
  assert.equal(result.status, 'fallback', 'Status must be fallback on network error');
  assert.equal(result.message, 'Weather API unavailable. Showing cached data.', 'Message must match exact required toast text');
  assert.ok(Array.isArray(result.villages), 'Villages must be returned as array');
  assert.ok(result.villages.length > 0, 'Villages must not be empty');
  assert.ok(result.last_updated, 'last_updated timestamp must be provided');
  assert.equal(result._source, 'fallback', '_source must indicate fallback');
});

test('3. Exact Toast Message String Verification', () => {
  const expectedToast = 'Weather API unavailable. Showing cached data.';
  
  // Verify App.jsx contains the exact toast string
  const appCode = readFileSync(resolve('src/App.jsx'), 'utf-8');
  assert.ok(
    appCode.includes(expectedToast),
    `App.jsx must contain exact toast string: "${expectedToast}"`
  );

  // Verify villages.js contains the exact fallback message string
  const apiCode = readFileSync(resolve('src/api/villages.js'), 'utf-8');
  assert.ok(
    apiCode.includes(expectedToast),
    `villages.js must contain fallback message: "${expectedToast}"`
  );
});

test('4. App.jsx Component Wiring Verification', () => {
  const appCode = readFileSync(resolve('src/App.jsx'), 'utf-8');
  
  // Must import refreshVillages
  assert.ok(appCode.includes('refreshVillages'), 'App.jsx must import and use refreshVillages');
  
  // Must maintain isRefreshing, lastUpdated, toastMessage state
  assert.ok(appCode.includes('isRefreshing'), 'App.jsx must manage isRefreshing state');
  assert.ok(appCode.includes('lastUpdated'), 'App.jsx must manage lastUpdated state');
  assert.ok(appCode.includes('toastMessage'), 'App.jsx must manage toastMessage state');
  
  // Must pass onRefresh and isRefreshing and lastUpdated to Navbar & DashboardView
  assert.ok(appCode.includes('onRefresh={handleRefresh}'), 'App.jsx must pass onRefresh handler');
  assert.ok(appCode.includes('isRefreshing={isRefreshing}'), 'App.jsx must pass isRefreshing');
  assert.ok(appCode.includes('lastUpdated={lastUpdated'), 'App.jsx must pass lastUpdated');
});

test('5. Navbar.jsx Refresh Button & Timestamp Verification', () => {
  const navbarCode = readFileSync(resolve('src/components/layout/Navbar.jsx'), 'utf-8');
  
  // Must accept onRefresh, isRefreshing, lastUpdated/lastSyncTime
  assert.ok(navbarCode.includes('onRefresh'), 'Navbar must accept onRefresh prop');
  assert.ok(navbarCode.includes('isRefreshing'), 'Navbar must accept isRefreshing prop');
  assert.ok(navbarCode.includes('lastUpdated'), 'Navbar must accept lastUpdated prop');
  
  // Must contain Refresh Data button with spinner and disabled state
  assert.ok(navbarCode.includes('Refresh Data'), 'Navbar must have Refresh Data button label');
  assert.ok(navbarCode.includes('animate-spin'), 'Navbar must animate spin when isRefreshing');
  assert.ok(navbarCode.includes('disabled={isRefreshing}'), 'Navbar must disable button when isRefreshing');
  assert.ok(navbarCode.includes('toLocaleTimeString()'), 'Navbar must display formatted timestamp');
});

test('6. DashboardView.jsx Refresh Button & Timestamp Verification', () => {
  const dashCode = readFileSync(resolve('src/components/dashboard/DashboardView.jsx'), 'utf-8');
  
  // Must accept onRefresh, isRefreshing, lastUpdated/lastSyncTime
  assert.ok(dashCode.includes('onRefresh'), 'DashboardView must accept onRefresh prop');
  assert.ok(dashCode.includes('isRefreshing'), 'DashboardView must accept isRefreshing prop');
  assert.ok(dashCode.includes('lastUpdated'), 'DashboardView must accept lastUpdated prop');
  
  // Must contain Refresh Data button with spinner and disabled state
  assert.ok(dashCode.includes('Refresh Data'), 'DashboardView must have Refresh Data button');
  assert.ok(dashCode.includes('animate-spin'), 'DashboardView must animate spin when isRefreshing');
  assert.ok(dashCode.includes('disabled={isRefreshing}'), 'DashboardView must disable button when isRefreshing');
});

test('7. MapView.jsx Reactivity & Risk Spectrum Verification', () => {
  const mapCode = readFileSync(resolve('src/components/map/MapView.jsx'), 'utf-8');
  
  // Must react to villages prop update
  assert.ok(mapCode.includes('[villages, selectedVillageId, onVillageSelect]'), 'MapView must have dependency on villages');
  assert.ok(mapCode.includes('markersLayer.clearLayers()'), 'MapView must clear layers before re-rendering');
  assert.ok(mapCode.includes('getRiskColor(score)'), 'MapView must derive color from risk score');
  assert.ok(mapCode.includes('live_rainfall_mm'), 'MapView must support dynamic live rainfall display');
});

test('8. Risk Math Calculations for Dynamic Scores', () => {
  // Critical risk (81-100) -> Red
  assert.equal(getRiskColor(85), '#e74c3c');
  assert.equal(getRiskLevel(85), 'Critical');
  
  // High risk (61-80) -> Orange
  assert.equal(getRiskColor(72), '#e67e22');
  assert.equal(getRiskLevel(72), 'High');
  
  // Moderate risk (31-60) -> Yellow
  assert.equal(getRiskColor(45), '#f39c12');
  assert.equal(getRiskLevel(45), 'Moderate');
  
  // Low risk (0-30) -> Green
  assert.equal(getRiskColor(20), '#27ae60');
  assert.equal(getRiskLevel(20), 'Low');
  
  // Population radius scaling
  assert.equal(getMarkerRadius(500), 7);
  assert.equal(getMarkerRadius(1500), 10);
  assert.equal(getMarkerRadius(3000), 14);
  assert.equal(getMarkerRadius(6000), 18);
});
