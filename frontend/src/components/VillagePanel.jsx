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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '20px', textAlign: 'center', color: '#555', fontFamily: 'sans-serif' }}>
                Click a village on the map to view details
            </div>
        );
    }

    if (loading) {
        return <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#666' }}>Loading village details...</div>;
    }

    if (error || !village) {
        return (
            <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#e74c3c' }}>
                <p><strong>Failed to load village details.</strong></p>
                <p style={{ fontSize: '13px' }}>Make sure your Python Flask backend is running on port 5000!</p>
            <div style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                <h3>Select a village on the map to view risk details.</h3>
            </div>
        );
    }

    const getBadgeColor = (level) => {
        switch (level) {
            case 'Critical': return '#e74c3c';
            case 'High': return '#e67e22';
            case 'Moderate': return '#f39c12';
            case 'Low': return '#27ae60';
            default: return '#7f8c8d';
        }
    };

    const getBarColor = (score) => {
        if (score >= 7) return '#e74c3c';
        if (score >= 4) return '#e67e22';
        return '#27ae60';
    };

    const renderBar = (label, score) => (
        <div style={{ marginBottom: '15px' }} key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
                <span>{label}</span>
                <strong>{score}/10</strong>
            </div>
            <div style={{ width: '100%', backgroundColor: '#eee', height: '8px', borderRadius: '4px' }}>
                <div style={{
                    width: `${score * 10}%`,
                    backgroundColor: getBarColor(score),
                    height: '100%',
                    borderRadius: '4px'
                }} />
            </div>
        </div>
    );

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h2 style={{ margin: '0 0 10px 0' }}>{village.name}</h2>
            
            <div style={{
                display: 'inline-block',
                backgroundColor: getBadgeColor(village.risk_level),
                color: 'white',
                padding: '5px 12px',
                borderRadius: '15px',
                fontWeight: 'bold',
                marginBottom: '25px',
                fontSize: '14px'
            }}>
                {village.risk_level} ({village.risk_score}/100)
            </div>

            <div style={{ marginBottom: '25px' }}>
                <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '8px', fontSize: '16px' }}>Location & Population</h3>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>District:</strong> {village.district}</p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>State:</strong> {village.state}</p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Population:</strong> {village.population ? village.population.toLocaleString() : 'N/A'}</p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Priority:</strong> {village.priority}</p>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '8px', fontSize: '16px', marginBottom: '15px' }}>Risk Factors</h3>
                {renderBar('Slope', village.slope_score)}
                {renderBar('Rainfall', village.rainfall_score)}
                {renderBar('Past Landslides', village.landslide_score)}
                {renderBar('Flood Risk', village.flood_score)}
                {renderBar('Road Access', village.road_score)}
            </div>

            {(village.risk_level === 'Critical' || village.risk_level === 'High') && (
                <button
                    onClick={() => onViewRelocation(villageId)}
                    style={{
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        padding: '12px 15px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        width: '100%',
                        fontSize: '15px'
                    }}
                >
                    Find Relocation Sites →
                </button>
            )}
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
