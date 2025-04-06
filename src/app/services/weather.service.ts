import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API_KEY = '517f17413098b75a13391587d7610c52';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  constructor(private http: HttpClient) {}

  getCurrentWeather(lat: number, lon: number, units = 'metric') {
    return this.http.get(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`);
  }

  getForecast(lat: number, lon: number, units = 'metric') {
    return this.http.get(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`);
  }

  getCityWeather(city: string, units = 'metric') {
    return this.http.get(`${BASE_URL}/weather?q=${city}&units=${units}&appid=${API_KEY}`);
  }
}
