import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function VillagePanel({ villageId, onViewRelocation }) {
    const [village, setVillage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!villageId) {
            setVillage(null);
            return;
        }
        
        setLoading(true);
        setError(false);

        axios.get(`http://localhost:5000/api/villages/${villageId}`)
            .then(response => {
                setVillage(response.data.village);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching village details:", err);
                setError(true);
                setLoading(false);
            });
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