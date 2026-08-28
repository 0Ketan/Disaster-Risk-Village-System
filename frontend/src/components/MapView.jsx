import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MapView = ({ onVillageSelect }) => {
    const [mapHtml, setMapHtml] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        axios.get('http://localhost:5000/api/map')
            .then(response => {
                setMapHtml(response.data.map_html);
                setLoading(false);
            })
            .catch(err => {
                console.error("Map fetch error:", err);
                setError(true);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'village_click') {
                onVillageSelect(event.data.id);
            }
        };
        
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onVillageSelect]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
                Loading risk map...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', color: '#e74c3c' }}>
                Failed to load map — check if backend is running
            </div>
        );
    }

    return (
        <iframe
            title="Risk Map"
            srcDoc={mapHtml}
            style={{ width: '100%', height: '100%', border: 'none' }}
        />
    );
};

export default MapView;
﻿const MapView = ({ onVillageClick }) => {
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
