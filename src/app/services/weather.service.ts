import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { timeout } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private apiKey = '517f17413098b75a13391587d7610c52';
  private apiUrl = 'https://api.openweathermap.org/data/2.5/';
  private geoUrl = 'https://api.openweathermap.org/geo/1.0/direct';

  constructor(private http: HttpClient) {}

  async getCurrentLocation() {
    const coords = await Geolocation.getCurrentPosition();
    return { lat: coords.coords.latitude, lon: coords.coords.longitude };
  }

  async isOnline(): Promise<boolean> {
    const status = await Network.getStatus();
    return status.connected;
  }

  getWeatherByCoords(lat: number, lon: number, unit: string) {
    return this.http.get(`${this.apiUrl}weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${unit}`).pipe(timeout(10000));
  }

  getForecastByCoords(lat: number, lon: number, unit: string) {
    return this.http.get(`${this.apiUrl}forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=${unit}`).pipe(timeout(10000));
  }

  getGeoByCity(city: string) {
    return this.http.get(`${this.geoUrl}?q=${city}&limit=1&appid=${this.apiKey}`)
      .toPromise()
      .then((res: any) => {
        if (!res.length) throw new Error('City not found');
        return { lat: res[0].lat, lon: res[0].lon };
      });
  }

  async cacheWeatherData(key: string, data: any) {
    await Preferences.set({ key, value: JSON.stringify(data) });
  }

  async getCachedWeatherData(key: string) {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : null;
  }

  async toggleTheme(isDark: boolean) {
    document.body.setAttribute('color-theme', isDark ? 'dark' : 'light');
    await Preferences.set({ key: 'theme', value: isDark ? 'dark' : 'light' });
  }

  async loadSavedTheme() {
    const { value } = await Preferences.get({ key: 'theme' });
    document.body.setAttribute('color-theme', value || 'light');
  }
}
