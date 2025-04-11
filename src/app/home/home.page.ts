import { Component, OnInit } from '@angular/core';
import { WeatherService } from '../services/weather.service';
import { FormControl } from '@angular/forms';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit {

  searchControl = new FormControl('');
  currentWeather: any;
  forecast: any[] = [];
  isCelsius: boolean = true;
  alertsEnabled: boolean = true;
  isDarkMode: boolean = false;

  constructor(
    private weatherService: WeatherService,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    await this.loadSettings();
    await this.loadWeatherByCurrentLocation();
  }

  async loadSettings() {
    const unit = await this.weatherService.getCachedWeatherData('unit');
    const alert = await this.weatherService.getCachedWeatherData('alerts');

    this.isCelsius = unit !== 'imperial';
    this.alertsEnabled = alert !== false;
  }

  async loadWeatherByCurrentLocation() {
    try {
      const coords = await this.weatherService.getCurrentLocation();
      await this.loadWeather(coords.lat, coords.lon);
    } catch (error) {
      this.showToast('Failed to get location.');
    }
  }

  async searchWeather() {
    const city = this.searchControl.value;
    if (!city) {
      this.showToast('Please enter a city name.');
      return;
    }

    try {
      const geo: any = await this.weatherService.getGeoByCity(city);
      await this.loadWeather(geo.lat, geo.lon);
    } catch (error) {
      this.showToast('City not found.');
    }
  }

  async loadWeather(lat: number, lon: number) {
    const online = await this.weatherService.isOnline();
  
    if (online) {
      // ONLINE → Fetch API
      this.currentWeather = await this.weatherService.getWeatherByCoords(lat, lon).toPromise();
      const forecastData: any = await this.weatherService.getForecastByCoords(lat, lon).toPromise();
      this.forecast = forecastData.list.slice(0, 5); 
  
      await this.weatherService.cacheWeatherData('lastWeatherData', {
        currentWeather: this.currentWeather,
        forecast: this.forecast,
      });
    } else {
      // OFFLINE → Load Cache
      const cached = await this.weatherService.getCachedWeatherData('lastWeatherData');
      if (cached) {
        this.currentWeather = cached.currentWeather;
        this.forecast = cached.forecast;
        this.showToast('Offline Mode: Loaded Cached Weather');
      } else {
        this.showToast('Offline Mode: No Cached Data');
      }
    }
  }
  
  checkTheme() {
    const currentTheme = document.body.getAttribute('color-theme');
    this.isDarkMode = currentTheme === 'dark';
  }
  
  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.weatherService.toggleTheme(this.isDarkMode);
  }
  
  toggleUnits() {
    this.isCelsius = !this.isCelsius;
    const unit = this.isCelsius ? 'metric' : 'imperial';
    this.weatherService.cacheWeatherData('unit', unit);
    this.loadWeatherByCurrentLocation();
  }

  toggleAlerts() {
    this.alertsEnabled = !this.alertsEnabled;
    this.weatherService.cacheWeatherData('alerts', this.alertsEnabled);
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000,
      position: 'top'
    });
    await toast.present();
  }
}
