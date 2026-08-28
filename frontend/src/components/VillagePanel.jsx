const VillagePanel = ({ villageId, onFindRelocation, onClose }) => {
    const [village, setVillage] = React.useState(null);

    React.useEffect(() => {
        if (!villageId) return;
        fetch(`http://localhost:5000/api/villages/${villageId}`)
            .then(res => res.json())
            .then(data => {
                if (data.village) setVillage(data.village);
            })
            .catch(err => console.error("Error fetching village:", err));
    }, [villageId]);

    if (!villageId) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                <h3>Select a village on the map to view risk details.</h3>
            </div>
        );
    }

    if (!village) return <div style={{ padding: '20px' }}>Loading...</div>;

    const riskColor = village.risk_level === 'Critical' ? '#c0392b' :
                      village.risk_level === 'High' ? '#d35400' :
                      village.risk_level === 'Moderate' ? '#f39c12' : '#27ae60';

    return (
        <div style={{ padding: '20px', backgroundColor: '#fff', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, color: '#2c3e50' }}>{village.name}</h2>
                <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
            </div>
            <p style={{ color: '#7f8c8d', margin: '5px 0 20px 0' }}>{village.district}, {village.state}</p>
            
            <div style={{ backgroundColor: riskColor, color: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Risk Level: {village.risk_level}</h3>
                <h1 style={{ margin: '10px 0 0 0', fontSize: '36px' }}>{village.risk_score} / 100</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div style={{ background: '#ecf0f1', padding: '10px', borderRadius: '4px' }}>
                    <b>Population:</b> {village.population}
                </div>
                <div style={{ background: '#ecf0f1', padding: '10px', borderRadius: '4px' }}>
                    <b>Priority:</b> {village.priority}
                </div>
            </div>

            <h4 style={{ borderBottom: '2px solid #ecf0f1', paddingBottom: '5px' }}>Risk Factors (0-10)</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '8px' }}>Slope Score: <b>{village.slope_score}</b></li>
                <li style={{ marginBottom: '8px' }}>Rainfall Score: <b>{village.rainfall_score}</b></li>
                <li style={{ marginBottom: '8px' }}>Landslide History: <b>{village.landslide_score}</b></li>
                <li style={{ marginBottom: '8px' }}>Flood Risk: <b>{village.flood_score}</b></li>
                <li style={{ marginBottom: '8px' }}>Road Access: <b>{village.road_score}</b></li>
            </ul>

            <button 
                onClick={() => onFindRelocation(village.id)}
                style={{
                    width: '100%', padding: '15px', backgroundColor: '#2980b9', 
                    color: 'white', border: 'none', borderRadius: '6px', 
                    fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                    marginTop: '20px'
                }}
            >
                Find Relocation Sites
            </button>
        </div>
    );
};
