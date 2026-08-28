const Dashboard = () => {
    const [villages, setVillages] = React.useState([]);

    React.useEffect(() => {
        fetch('http://localhost:5000/api/dashboard')
            .then(res => res.json())
            .then(data => {
                if (data.priority_list) setVillages(data.priority_list);
            })
            .catch(err => console.error("Error fetching dashboard:", err));
    }, []);

    const getRiskBadge = (level) => {
        const colors = {
            'Critical': '#c0392b',
            'High': '#d35400',
            'Moderate': '#f39c12',
            'Low': '#27ae60'
        };
        return (
            <span style={{ 
                background: colors[level] || '#95a5a6', color: 'white', 
                padding: '4px 8px', borderRadius: '4px', fontSize: '12px' 
            }}>
                {level}
            </span>
        );
    };

    return (
        <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ color: '#2c3e50', borderBottom: '2px solid #34495e', paddingBottom: '10px' }}>Executive Dashboard</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', margin: '20px 0' }}>
                <div style={{ background: '#ecf0f1', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <h3>Total Villages</h3>
                    <h2>{villages.length}</h2>
                </div>
                <div style={{ background: '#fadbd8', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <h3>Critical Risk</h3>
                    <h2>{villages.filter(v => v.risk_level === 'Critical').length}</h2>
                </div>
                <div style={{ background: '#fdebd0', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <h3>High Risk</h3>
                    <h2>{villages.filter(v => v.risk_level === 'High').length}</h2>
                </div>
                <div style={{ background: '#d5f5e3', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <h3>Low Risk</h3>
                    <h2>{villages.filter(v => v.risk_level === 'Low').length}</h2>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                <thead>
                    <tr style={{ backgroundColor: '#34495e', color: 'white', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>Village</th>
                        <th style={{ padding: '12px' }}>District</th>
                        <th style={{ padding: '12px' }}>Population</th>
                        <th style={{ padding: '12px' }}>Risk Score</th>
                        <th style={{ padding: '12px' }}>Risk Level</th>
                        <th style={{ padding: '12px' }}>Priority Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {villages.map((v, i) => (
                        <tr key={v.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{v.name}</td>
                            <td style={{ padding: '12px' }}>{v.district}</td>
                            <td style={{ padding: '12px' }}>{v.population}</td>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: v.risk_score > 70 ? '#c0392b' : '#2c3e50' }}>{v.risk_score}</td>
                            <td style={{ padding: '12px' }}>{getRiskBadge(v.risk_level)}</td>
                            <td style={{ padding: '12px', fontStyle: 'italic' }}>{v.priority}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
