import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMarkerRadius, getRiskColor, getRiskLevel } from './VillageMarker';
import MapLegend from './MapLegend';

// Fix default Leaflet icon paths in bundler environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Native Leaflet.js MapView Component
 * Renders interactive map canvas with custom population-scaled circle markers,
 * 4-tier risk color spectrum, selection highlights, and auto-zoom.
 */
export const MapView = ({ 
  villages = [], 
  selectedVillageId, 
  onVillageSelect 
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const selectedHaloRef = useRef(null);

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Prevent duplicate map initialization
    if (!mapInstanceRef.current) {
      // Centered on Uttarakhand Himalayan Disaster Corridor (Rudraprayag / Garhwal)
      const map = L.map(mapContainerRef.current, {
        center: [30.45, 79.05],
        zoom: 10,
        zoomControl: true,
        attributionControl: true,
      });

      // Add high-resolution base tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | VillageShield',
      }).addTo(map);

      // Create feature group for village markers
      const markersLayer = L.featureGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Village CircleMarkers when villages list or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    if (selectedHaloRef.current) {
      selectedHaloRef.current.remove();
      selectedHaloRef.current = null;
    }

    villages.forEach((village) => {
      const lat = Number(village.latitude);
      const lng = Number(village.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const isSelected = Number(selectedVillageId) === Number(village.id);
      const score = Math.round(village.risk_score || 0);
      const level = village.risk_level || getRiskLevel(score);
      const radius = getMarkerRadius(village.population);
      const color = getRiskColor(score);
      const isFallback = village._source === 'fallback';

      // Create CircleMarker
      const marker = L.circleMarker([lat, lng], {
        radius: isSelected ? radius + 3 : radius,
        fillColor: color,
        color: isSelected ? '#ffffff' : '#1e293b',
        weight: isSelected ? 3 : 1.5,
        opacity: 1,
        fillOpacity: isSelected ? 0.95 : 0.82,
      });

      // Bind rich popup
      const popupHtml = `
        <div style="font-family: 'Inter', sans-serif; min-width: 180px;">
          <div style="font-size: 14px; font-weight: 700; color: #04122e; margin-bottom: 2px;">
            ${village.name}
          </div>
          <div style="font-size: 11px; color: #45464d; margin-bottom: 6px;">
            ${village.district}, ${village.state || 'Uttarakhand'}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f2f4f7; padding: 4px 8px; border-radius: 4px; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 600;">Risk Score:</span>
            <span style="font-size: 12px; font-weight: 800; color: ${color};">${score}/100</span>
          </div>
          <div style="font-size: 11px; color: #45464d; display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Population:</span>
            <span style="font-weight: 600;">${village.population ? village.population.toLocaleString() : 'N/A'}</span>
          </div>
          ${(village.live_rainfall_mm !== undefined && village.live_rainfall_mm !== null && village.live_rainfall_mm > 0) ? `
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #0284c7; margin-bottom: 4px;">
              <span>Live Rainfall:</span>
              <span style="font-weight: 700;">${Number(village.live_rainfall_mm).toFixed(1)} mm</span>
            </div>
          ` : ''}
          ${isFallback ? `
            <div style="margin-top: 6px; padding: 2px 6px; background: #fef08a; border: 1px solid #fde047; border-radius: 4px; color: #854d0e; font-size: 10px; font-weight: 600; text-align: center;">
              ⚠ Cached data
            </div>
          ` : ''}
        </div>
      `;
      marker.bindPopup(popupHtml);

      // Bind hover tooltip
      marker.bindTooltip(`<b>${village.name}</b> (${score}/100)`, {
        direction: 'top',
        offset: [0, -radius],
        opacity: 0.9,
      });

      // On marker click: select village and notify parent
      marker.on('click', () => {
        onVillageSelect(village.id);
      });

      marker.addTo(markersLayer);

      // If selected, add an outer pulsing highlight ring
      if (isSelected) {
        const halo = L.circleMarker([lat, lng], {
          radius: radius + 8,
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 0.6,
          fillOpacity: 0.2,
          dashArray: '3, 6',
        }).addTo(map);
        selectedHaloRef.current = halo;
      }
    });
  }, [villages, selectedVillageId, onVillageSelect]);

  // Handle map container resizing (fixes the black bar when sidebar slides)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = mapContainerRef.current;
    if (!map || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Smoothly fly to selected village when selectedVillageId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedVillageId) return;

    const selected = villages.find((v) => Number(v.id) === Number(selectedVillageId));
    if (selected && selected.latitude && selected.longitude) {
      map.flyTo([Number(selected.latitude), Number(selected.longitude)], 12, {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedVillageId, villages]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-map-bg">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      <MapLegend />
    </div>
  );
};

export default MapView;
