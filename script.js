// Add your OpenWeatherMap API Key here
const apiKey = '0b6c9d94cac7b67f523ac2005ae385e7';

// Cities to check (you can change this to the 5 cities you prefer)
const cities = [
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
    { name: 'Houston', lat: 29.7604, lon: -95.3698 },
    { name: 'Phoenix', lat: 33.4484, lon: -112.0740 }
];

// Function to fetch air pollution data for a given city
async function fetchAirPollutionData(city) {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${city.lat}&lon=${city.lon}&appid=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

// Function to display city pollution data
function displayCityData(city, pollution) {
    const cityElement = document.createElement('div');
    cityElement.className = 'city';
    
    const date = new Date(pollution.dt * 1000); // Convert Unix timestamp to JavaScript Date object
    
    cityElement.innerHTML = `
        <h2>${city.name}</h2>
        <p>Air Quality Index: ${pollution.main.aqi}</p>
        <p>Last updated: ${date.toLocaleString()}</p>
        <p>CO: ${pollution.components.co} μg/m3</p>
        <p>NO2: ${pollution.components.no2} μg/m3</p>
        <p>O3: ${pollution.components.o3} μg/m3</p>
        <p>PM2.5: ${pollution.components.pm2_5} μg/m3</p>
        <p>PM10: ${pollution.components.pm10} μg/m3</p>
    `;
    
    document.getElementById('cities').appendChild(cityElement);
}

// Fetch and display data for all cities
async function fetchAndDisplayData() {
    document.getElementById('cities').innerHTML = ''; // Clear old data
    for (let city of cities) {
        const pollutionData = await fetchAirPollutionData(city);
        displayCityData(city, pollutionData.list[0]);
    }
}

// Initial data fetch
fetchAndDisplayData();

// Refresh data every hour
setInterval(fetchAndDisplayData, 3600000); // 3600000 ms = 1 hour
