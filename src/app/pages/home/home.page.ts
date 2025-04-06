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
    this.searchCity(); 
  }

  async searchCity() {
    
    const lat = 35;
    const lon = 139;

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${this.city}&units=${this.units}&appid=517f17413098b75a13391587d7610c52`
    );
    this.weather = await response.json();

    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${this.city}&units=${this.units}&appid=517f17413098b75a13391587d7610c52`
    );
    this.forecast = await forecastRes.json();
  }
}
