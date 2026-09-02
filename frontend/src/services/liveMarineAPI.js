import axios from 'axios';

export const fetchLiveCoastalConditions = async (lat, lng) => {
  try {
    const [marineRes, weatherRes] = await Promise.all([
      axios.get(`https://marine-api.open-meteo.com/v1/marine`, {
        params: {
          latitude: lat,
          longitude: lng,
          hourly: 'wave_height,swell_wave_height,wave_period',
          past_days: 1,
          forecast_days: 7
        }
      }),
      axios.get(`https://api.open-meteo.com/v1/forecast`, {
        params: {
          latitude: lat,
          longitude: lng,
          current: 'temperature_2m,wind_speed_10m,precipitation',
          hourly: 'rain'
        }
      })
    ]);

    const marineData = marineRes.data;
    const weatherData = weatherRes.data;

    // We assume the first index of current hour for marine data or we find the current hour index
    const now = new Date();
    // Open-Meteo hourly times are ISO strings. We find the closest hour.
    const currentHourISO = now.toISOString().slice(0, 14) + '00:00';
    
    // Find index in marine hourly
    let marineIndex = marineData.hourly.time.findIndex(t => t.startsWith(currentHourISO.slice(0, 13)));
    if (marineIndex === -1) marineIndex = 0; // fallback

    const currentWaveHeight = marineData.hourly.wave_height[marineIndex];
    const currentSwellHeight = marineData.hourly.swell_wave_height[marineIndex];
    const currentWavePeriod = marineData.hourly.wave_period[marineIndex];

    const currentWindSpeed = weatherData.current.wind_speed_10m;
    const currentRain = weatherData.current.precipitation;
    const currentTemp = weatherData.current.temperature_2m;

    // Forecast for the next 7 days (168 hours)
    const forecastMarine = {
      time: marineData.hourly.time.slice(marineIndex, marineIndex + 168),
      wave_height: marineData.hourly.wave_height.slice(marineIndex, marineIndex + 168),
      swell_wave_height: marineData.hourly.swell_wave_height.slice(marineIndex, marineIndex + 168)
    };

    return {
      nowcast: {
        wave_height: currentWaveHeight,
        swell_wave_height: currentSwellHeight,
        wave_period: currentWavePeriod,
        wind_speed_10m: currentWindSpeed,
        rain: currentRain,
        temperature_2m: currentTemp
      },
      forecast: forecastMarine,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching live marine API:", error);
    throw error;
  }
};
