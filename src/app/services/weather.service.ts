import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  private apiKey = '517f17413098b75a13391587d7610c52'; // OpenWeatherMap API key
  private apiUrl = 'https://api.openweathermap.org/data/2.5/';
  private geoUrl = 'https://api.openweathermap.org/geo/1.0/direct';
  private timeZoneDBKey = '0EDM36IVU7V1'; // Your TimeZoneDB API key

  constructor(private http: HttpClient) {}

  // Get current location using device GPS
  async getCurrentLocation() {
    const coordinates = await Geolocation.getCurrentPosition();
    return {
      lat: coordinates.coords.latitude,
      lon: coordinates.coords.longitude
    };
  }

  // Check if online
  async isOnline(): Promise<boolean> {
    const status = await Network.getStatus();
    return status.connected;
  }

  // Get current weather by coordinates
  getWeatherByCoords(lat: number, lon: number, unit: string) {
    return this.http.get(`${this.apiUrl}weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${unit}`);
  }

  // Get forecast by coordinates
  getForecastByCoords(lat: number, lon: number, unit: string) {
    return this.http.get(`${this.apiUrl}forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${unit}`);
  }

  // Search coordinates by city name
  getGeoByCity(city: string) {
    return this.http.get(`${this.geoUrl}?q=${city}&limit=1&appid=${this.apiKey}`)
      .toPromise()
      .then((res: any) => {
        if (!res.length) throw new Error('City not found');
        return { lat: res[0].lat, lon: res[0].lon };
      });
  }

  // Get timezone string from TimeZoneDB based on lat/lon
  getTimeZone(lat: number, lon: number): Promise<string> {
    const url = `http://api.timezonedb.com/v2.1/get-time-zone?key=${this.timeZoneDBKey}&format=json&by=position&lat=${lat}&lng=${lon}`;
    return this.http.get<any>(url).toPromise().then(res => res.zoneName);
  }

  // Cache any weather data
  async cacheWeatherData(key: string, data: any) {
    await Preferences.set({ key, value: JSON.stringify(data) });
  }

  // Retrieve cached weather data
  async getCachedWeatherData(key: string) {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : null;
  }

  // Theme handling
  async toggleTheme(isDark: boolean) {
    document.body.setAttribute('color-theme', isDark ? 'dark' : 'light');
    await Preferences.set({
      key: 'theme',
      value: isDark ? 'dark' : 'light'
    });
  }

  async loadSavedTheme() {
    const { value } = await Preferences.get({ key: 'theme' });
    document.body.setAttribute('color-theme', value || 'light');
  }
}
