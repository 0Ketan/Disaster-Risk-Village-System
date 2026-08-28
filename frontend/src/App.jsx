import React, { useState } from 'react';
import MapView from './components/MapView';
import VillagePanel from './components/VillagePanel';

// Member 5 will build these components later. We leave them commented out for now.
// import Dashboard from './components/Dashboard';
// import RelocationPanel from './components/RelocationPanel';

export default function App() {
  // State to track which tab is open and which village is clicked
  const [activeTab, setActiveTab] = useState('map'); 
  const [selectedVillageId, setSelectedVillageId] = useState(null);
  const [showRelocation, setShowRelocation] = useState(false);

  // This function runs when a village is clicked on the map OR the dashboard
  const handleVillageSelect = (id) => {
    setSelectedVillageId(id);
    setShowRelocation(false);
    setActiveTab('map');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', margin: 0 }}>
      {/* Top Navigation Bar */}
      <header style={{ backgroundColor: '#2c3e50', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>Disaster Risk Village System</h1>
        <div>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{ 
              marginRight: '10px', padding: '8px 15px', cursor: 'pointer', 
              backgroundColor: activeTab === 'dashboard' ? '#3498db' : '#34495e',
              color: 'white', border: 'none', borderRadius: '4px'
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('map')}
            style={{ 
              padding: '8px 15px', cursor: 'pointer',
              backgroundColor: activeTab === 'map' ? '#3498db' : '#34495e',
              color: 'white', border: 'none', borderRadius: '4px'
            }}
          >
            Map View
          </button>
        </div>
      </header>

      {/* Main Split-Screen Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {activeTab === 'dashboard' ? (
          <div style={{ width: '100%', padding: '20px', overflowY: 'auto' }}>
            <h2>Dashboard</h2>
            <p>Member 5 will insert the Dashboard component here.</p>
            {/* <Dashboard onVillageSelect={handleVillageSelect} /> */}
          </div>
        ) : (
          <>
            {/* Left Side: The Map (Takes up 2/3 of the screen) */}
            <div style={{ flex: 2, borderRight: '2px solid #ccc', backgroundColor: '#e9ecef' }}>
              <MapView onVillageSelect={handleVillageSelect} />
            </div>

            {/* Right Side: The Details Panel (Takes up 1/3 of the screen) */}
            <div style={{ flex: 1, backgroundColor: '#f8f9fa', overflowY: 'auto' }}>
              {showRelocation ? (
                <div style={{ padding: '20px' }}>
                  <h2>Relocation Sites</h2>
                  <p>Member 5 will insert the RelocationPanel component here.</p>
                  <button 
                    onClick={() => setShowRelocation(false)}
                    style={{ padding: '8px 12px', cursor: 'pointer' }}
                  >
                    ← Back to Village Details
                  </button>
                  {/* <RelocationPanel villageId={selectedVillageId} onBack={() => setShowRelocation(false)} /> */}
                </div>
              ) : (
                <VillagePanel
                  villageId={selectedVillageId}
                  onViewRelocation={(id) => setShowRelocation(true)}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}