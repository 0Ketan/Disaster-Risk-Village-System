const App = () => {
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
