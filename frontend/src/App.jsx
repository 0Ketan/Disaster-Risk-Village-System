import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import MapView from './components/map/MapView';
import DetailDrawer from './components/drawer/DetailDrawer';
import DashboardView from './components/dashboard/DashboardView';
import { getVillages, getVillageById, getDashboardSummary } from './api/villages';
import { getApiHealthStatus } from './api/health';

/**
 * Main Application Shell (VillageShield)
 * Unified state orchestration between Map, Sidebar, Detail Drawer, and Dashboard.
 */
export const App = () => {
  const [activeView, setActiveView] = useState('map'); // 'map' | 'dashboard'
  const [villages, setVillages] = useState([]);
  const [selectedVillageId, setSelectedVillageId] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [apiHealth, setApiHealth] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);

  // Fetch all initial data
  const fetchData = useCallback(async () => {
    try {
      const [villagesRes, healthRes, summaryRes] = await Promise.all([
        getVillages(),
        getApiHealthStatus(),
        getDashboardSummary(),
      ]);

      if (villagesRes && villagesRes.villages) {
        setVillages(villagesRes.villages);
      }

      if (healthRes && healthRes.services) {
        setApiHealth(healthRes.services);
      }

      if (summaryRes) {
        setSummary(summaryRes);
      }
    } catch (err) {
      console.error('VillageShield failed initial data load:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Periodic background health check every 30 seconds
    const interval = setInterval(() => {
      getApiHealthStatus().then((res) => {
        if (res && res.services) setApiHealth(res.services);
      }).catch(console.warn);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // When selectedVillageId changes, load detailed village record
  useEffect(() => {
    let isMounted = true;
    if (!selectedVillageId) {
      setSelectedVillage(null);
      return;
    }

    const localFound = villages.find((v) => Number(v.id) === Number(selectedVillageId));
    if (localFound) {
      setSelectedVillage(localFound);
    }

    // Also fetch full detail from API for any supplementary attributes
    getVillageById(selectedVillageId)
      .then((res) => {
        if (isMounted && res && res.village) {
          setSelectedVillage((prev) => ({ ...prev, ...res.village }));
        }
      })
      .catch((err) => {
        console.warn(`Could not fetch details for village ${selectedVillageId}:`, err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedVillageId, villages]);

  const handleVillageSelect = useCallback((id) => {
    setSelectedVillageId(id);
    // If selecting from Dashboard, switch to map view for visual geographical context
    if (activeView !== 'map') {
      setActiveView('map');
    }
  }, [activeView]);

  const handleCloseDrawer = useCallback(() => {
    setSelectedVillageId(null);
    setSelectedVillage(null);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Derived counts for navbar
  const criticalCount = useMemo(() => {
    return villages.filter((v) => v.risk_score >= 81 || v.risk_level === 'Critical').length;
  }, [villages]);

  const highCount = useMemo(() => {
    return villages.filter((v) => (v.risk_score >= 61 && v.risk_score <= 80) || v.risk_level === 'High').length;
  }, [villages]);

  const populationAtRisk = useMemo(() => {
    return villages.reduce((sum, v) => sum + (Number(v.population) || 0), 0);
  }, [villages]);

  const hasFallbackData = useMemo(() => {
    const hasFallbackVillage = villages.some((v) => v._source === 'fallback');
    const hasFallbackHealth = apiHealth.some((s) => s.mode === 'fallback' || s.status === 'degraded');
    return hasFallbackVillage || hasFallbackHealth;
  }, [villages, apiHealth]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface font-sans">
      {/* Top Fixed Navigation Bar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        totalVillages={villages.length}
        criticalCount={criticalCount}
        highCount={highCount}
        populationAtRisk={populationAtRisk}
        hasFallbackData={hasFallbackData}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex pt-nav h-[calc(100vh-60px)] overflow-hidden relative">
        {activeView === 'map' ? (
          <>
            {/* Left Sidebar Container */}
            <div 
              className={`transition-all duration-300 ease-in-out flex-shrink-0 relative ${isLeftSidebarOpen ? 'w-full md:w-sidebar' : 'w-0 overflow-hidden'}`}
            >
              <div className="w-full md:w-sidebar h-full">
                <Sidebar
                  villages={villages}
                  selectedVillageId={selectedVillageId}
                  onVillageSelect={handleVillageSelect}
                  apiHealth={apiHealth}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Toggle Left Sidebar Button */}
            <button
              onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-[400] bg-surface border border-outline-variant rounded-r-lg shadow-md p-1.5 flex items-center justify-center hover:bg-surface-variant transition-colors"
              title={isLeftSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              style={{ transform: isLeftSidebarOpen ? 'translate(380px, -50%)' : 'translate(0, -50%)', transition: 'transform 300ms ease-in-out' }}
            >
              <span className="text-on-surface-variant text-xl leading-none">
                {isLeftSidebarOpen ? '‹' : '›'}
              </span>
            </button>

            {/* Central Interactive Map */}
            <main className="flex-1 h-full relative overflow-hidden">
              <MapView
                villages={villages}
                selectedVillageId={selectedVillageId}
                onVillageSelect={handleVillageSelect}
              />
            </main>

            {/* Slide-out Detail Drawer */}
            {selectedVillage && (
              <DetailDrawer
                village={selectedVillage}
                onClose={handleCloseDrawer}
              />
            )}
          </>
        ) : (
          /* Executive Dashboard View */
          <DashboardView
            villages={villages}
            summary={summary}
            onVillageSelect={handleVillageSelect}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        )}
      </div>
    </div>
  );
};

export default App;
