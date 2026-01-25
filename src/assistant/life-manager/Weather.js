/**
 * WeatherService.js
 * Fetches real-time weather data using OpenMeteo (Free, No API Key).
 */

export class WeatherService {
    constructor() {
        this.baseUrl = "https://api.open-meteo.com/v1/forecast";
        this.cache = null;
        this.lastFetch = 0;
    }

    /**
     * Get current weather for coordinates
     * @param {number} lat - Latitude (default: Kochi, India for demo)
     * @param {number} lon - Longitude
     */
    async getWeather(lat = 9.9312, lon = 76.2673) {
        // Cache for 15 minutes
        const now = Date.now();
        if (this.cache && (now - this.lastFetch < 15 * 60 * 1000)) {
            console.log('[Weather] Serving from cache');
            return this.cache;
        }

        try {
            console.log('[Weather] Fetching from OpenMeteo...');
            const url = `${this.baseUrl}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
            const response = await fetch(url);
            const data = await response.json();

            if (!data.current) throw new Error("Invalid weather data");

            const weather = {
                temp: Math.round(data.current.temperature_2m),
                condition: this.decodeWeatherCode(data.current.weather_code),
                humidity: data.current.relative_humidity_2m,
                high: Math.round(data.daily.temperature_2m_max[0]),
                low: Math.round(data.daily.temperature_2m_min[0]),
                location: "Kochi, IN", // In reality, we'd use a geocoding API or browser geolocation
                isMock: false
            };

            this.cache = weather;
            this.lastFetch = now;
            return weather;

        } catch (error) {
            console.error("[WeatherService] Fetch failed:", error);
            // Fallback mock data
            return {
                temp: 28,
                condition: "Sunny",
                humidity: 75,
                high: 32,
                low: 26,
                location: "Offline",
                isMock: true
            };
        }
    }

    decodeWeatherCode(code) {
        const codes = {
            0: "Clear Sky",
            1: "Mainly Clear",
            2: "Partly Cloudy",
            3: "Overcast",
            45: "Fog",
            48: "Fog",
            51: "Drizzle",
            53: "Drizzle",
            55: "Drizzle",
            61: "Rain",
            63: "Rain",
            65: "Heavy Rain",
            71: "Snow",
            95: "Thunderstorm"
        };
        return codes[code] || "Unknown";
    }
}

export const weatherService = new WeatherService();
