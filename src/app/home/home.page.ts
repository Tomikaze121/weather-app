import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone:false,
})
export class HomePage {
  city: string = '';
  weather: any = null;
  forecast: any = null;
  units: string = 'metric';

  constructor() {}

  toggleTheme() {
    document.body.classList.toggle('dark');
  }

  toggleUnits() {
    this.units = this.units === 'metric' ? 'imperial' : 'metric';
    if (this.city) {
      this.searchCity();
    }
  }

  async searchCity() {
    if (!this.city) return;

    try {
      const apiKey = '517f17413098b75a13391587d7610c52';

      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${this.city}&units=${this.units}&appid=${apiKey}`
      );
      this.weather = await weatherRes.json();

      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${this.city}&units=${this.units}&appid=${apiKey}`
      );
      this.forecast = await forecastRes.json();
    } catch (error) {
      console.error('Weather fetch error:', error);
    }
  }
}
