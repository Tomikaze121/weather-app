import * as L from 'leaflet';
import { Component, AfterViewInit } from '@angular/core';
import { GeolocationService } from '../services/geolocation.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements AfterViewInit {
  city: string = '';
  weather: any = null;
  forecast: any = null;
  units: string = 'metric';
  map: any;
  showInfo: boolean = false;

  constructor(private geo: GeolocationService) {}

  ngAfterViewInit() {
    this.initMap();
  }

  async initMap() {
    const coords = await this.geo.getCurrentPosition();

    this.map = L.map('map').setView([coords.lat, coords.lon], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    const userMarker = L.marker([coords.lat, coords.lon]).addTo(this.map);
    userMarker.bindPopup('You are here!').openPopup();

    this.map.on('click', async (e: any) => {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;

      this.map.setView([lat, lon], 12);
      L.marker([lat, lon]).addTo(this.map);
      await this.getWeatherByCoords(lat, lon);
      this.showInfo = true;
    });
  }

  async getWeatherByCoords(lat: number, lon: number) {
    try {
      const apiKey = '517f17413098b75a13391587d7610c52';

      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${this.units}&appid=${apiKey}`
      );
      this.weather = await weatherResponse.json();

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${this.units}&appid=${apiKey}`
      );
      this.forecast = await forecastResponse.json();
    } catch (error) {
      console.error('Weather fetch error:', error);
    }
  }

  async searchCity() {
    if (!this.city) return;

    try {
      const apiKey = '517f17413098b75a13391587d7610c52';

      
      const geoResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${this.city},PH&limit=1&appid=${apiKey}`);
      const geoData = await geoResponse.json();

      if (geoData.length === 0) {
        console.error('No location found for the specified city.');
        return;
      }

      const selectedLocation = geoData[0];
      const lat = selectedLocation.lat;
      const lon = selectedLocation.lon;

      if (lat && lon) {
        this.map.setView([lat, lon], 12);
        L.marker([lat, lon]).addTo(this.map);
        await this.getWeatherByCoords(lat, lon);
        this.showInfo = true;
      }
    } catch (error) {
      console.error('City search error:', error);
    }
  }

  closeInfo() {
    this.showInfo = false;
  }

  toggleTheme() {
    document.body.classList.toggle('dark');
  }

  toggleUnits() {
    this.units = this.units === 'metric' ? 'imperial' : 'metric';
    if (this.weather) {
      const lat = this.weather.coord.lat;
      const lon = this.weather.coord.lon;
      this.getWeatherByCoords(lat, lon);
    }
  }
}
