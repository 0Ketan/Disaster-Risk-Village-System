const RelocationPanel = ({ villageId, onBack }) => {
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetch(`http://localhost:5000/api/villages/${villageId}/relocation`)
            .then(res => res.json())
            .then(resData => {
                setData(resData);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching relocation:", err);
                setLoading(false);
            });
    }, [villageId]);

    if (loading) {
        return <div style={{ padding: '20px' }}>Analyzing best sites...</div>;
    }

    if (!data || !data.sites || data.sites.length === 0) {
        return (
            <div style={{ padding: '20px' }}>
                <button onClick={onBack} style={{ marginBottom: '20px', cursor: 'pointer' }}>&larr; Back to Village</button>
                <h3>No valid relocation sites found.</h3>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', backgroundColor: '#fff', height: '100%', overflowY: 'auto' }}>
            <button 
                onClick={onBack} 
                style={{ 
                    marginBottom: '20px', background: 'none', border: 'none', 
                    color: '#2980b9', cursor: 'pointer', fontWeight: 'bold' 
                }}
            >
                &larr; Back to {data.village_name}
            </button>
            
            <h2 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>Top Relocation Options</h2>

            {data.sites.map((site, index) => (
                <div key={site.id} style={{ 
                    border: '1px solid #bdc3c7', borderRadius: '8px', 
                    padding: '15px', marginBottom: '20px',
                    boxShadow: index === 0 ? '0 4px 6px rgba(41, 128, 185, 0.2)' : 'none',
                    borderColor: index === 0 ? '#2980b9' : '#bdc3c7'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: '#2980b9' }}>
                            {index + 1}. {site.name}
                        </h3>
                        <span style={{ 
                            background: '#2ecc71', color: 'white', padding: '4px 8px', 
                            borderRadius: '12px', fontSize: '14px', fontWeight: 'bold'
                        }}>
                            {site.overall_score}/100
                        </span>
                    </div>
                    
                    <p style={{ fontSize: '14px', color: '#34495e', fontStyle: 'italic', margin: '10px 0' }}>
                        "{site.explanation}"
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', marginTop: '15px' }}>
                        <div><b>Distance:</b> {site.distance_km} km</div>
                        <div><b>Spots Left:</b> {site.available_capacity}</div>
                        <div><b>Safety:</b> {site.score_breakdown.safety}</div>
                        <div><b>Roads:</b> {site.score_breakdown.road}</div>
                        <div><b>Healthcare:</b> {site.score_breakdown.healthcare}</div>
                        <div><b>Water:</b> {site.score_breakdown.water}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};
