const MapView = ({ onVillageClick }) => {
    const [mapHtml, setMapHtml] = React.useState('');

    React.useEffect(() => {
        fetch('http://localhost:5000/api/map')
            .then(res => res.json())
            .then(data => {
                if (data.map_html) {
                    setMapHtml(data.map_html);
                }
            })
            .catch(err => console.error("Error fetching map:", err));
    }, []);

    React.useEffect(() => {
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'village_click') {
                onVillageClick(event.data.id);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onVillageClick]);

    return (
        <div style={{ flex: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ padding: '10px 20px', margin: 0, backgroundColor: '#2c3e50', color: 'white' }}>Live Risk Map</h2>
            <iframe 
                srcDoc={mapHtml}
                style={{ flex: 1, border: 'none', width: '100%', backgroundColor: '#ecf0f1' }}
                title="Risk Map"
            />
        </div>
    );
};
