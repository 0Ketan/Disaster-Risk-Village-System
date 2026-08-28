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
﻿const App = () => {
    const [activeTab, setActiveTab] = React.useState('map'); // 'map' or 'dashboard'
    const [selectedVillageId, setSelectedVillageId] = React.useState(null);
    const [showRelocation, setShowRelocation] = React.useState(false);

    const handleVillageClick = (id) => {
        setSelectedVillageId(id);
        setShowRelocation(false);
    };

    const handleFindRelocation = (id) => {
        setShowRelocation(true);
    };

    const handleCloseSidebar = () => {
        setSelectedVillageId(null);
        setShowRelocation(false);
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', margin: 0 }}>
            {/* Header / Navbar */}
            <header style={{ 
                backgroundColor: '#2c3e50', padding: '15px 20px', 
                color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
            }}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>Disaster Risk Village System</h1>
                <div>
                    <button 
                        onClick={() => setActiveTab('map')}
                        style={{ 
                            background: activeTab === 'map' ? '#2980b9' : 'transparent', 
                            color: 'white', border: '1px solid #2980b9', 
                            padding: '8px 16px', marginRight: '10px', 
                            borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
                        }}
                    >
                        Live Map
                    </button>
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        style={{ 
                            background: activeTab === 'dashboard' ? '#2980b9' : 'transparent', 
                            color: 'white', border: '1px solid #2980b9', 
                            padding: '8px 16px', 
                            borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
                        }}
                    >
                        Executive Dashboard
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {activeTab === 'dashboard' ? (
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <Dashboard />
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
                        {/* Map View */}
                        <MapView onVillageClick={handleVillageClick} />
                        
                        {/* Sidebar */}
                        <div style={{ 
                            width: selectedVillageId ? '350px' : '0px',
                            transition: 'width 0.3s ease',
                            borderLeft: selectedVillageId ? '2px solid #bdc3c7' : 'none',
                            boxShadow: selectedVillageId ? '-2px 0 5px rgba(0,0,0,0.1)' : 'none',
                            overflow: 'hidden',
                            backgroundColor: '#fff'
                        }}>
                            {selectedVillageId && (
                                showRelocation ? (
                                    <RelocationPanel 
                                        villageId={selectedVillageId} 
                                        onBack={() => setShowRelocation(false)} 
                                    />
                                ) : (
                                    <VillagePanel 
                                        villageId={selectedVillageId} 
                                        onFindRelocation={handleFindRelocation}
                                        onClose={handleCloseSidebar}
                                    />
                                )
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
