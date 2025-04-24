import { Component, OnInit } from '@angular/core';
import { WeatherService } from '../services/weather.service';
import { FormControl } from '@angular/forms';
import { ToastController, LoadingController } from '@ionic/angular';

interface WeatherItem {
  dt_txt: string;
  weather: { main: string; description: string; icon: string }[];
  main: { temp: number; humidity: number };
  wind: { speed: number };
  localTime?: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  searchControl = new FormControl('');
  currentWeather: any;
  forecast: WeatherItem[] = [];
  hourlyForecast: WeatherItem[] = [];
  hourlyGroups: { period: string, data: WeatherItem[] }[] = [];
  hourPage = 1;
  hourLimit = 8;
  timeFormat24 = true;
  isCelsius = true;
  alertsEnabled = true;
  isDarkMode = false;
  unitType = 'metric';
  backgroundClass = 'default-bg';

  constructor(
    private weatherService: WeatherService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    await this.weatherService.loadSavedTheme();
    await this.loadSettings();
    await this.loadWeatherByCurrentLocation();
    this.checkTheme();
  }

  async loadSettings() {
    const unit = await this.weatherService.getCachedWeatherData('unit');
    const alert = await this.weatherService.getCachedWeatherData('alerts');
    this.isCelsius = unit !== 'imperial';
    this.unitType = this.isCelsius ? 'metric' : 'imperial';
    this.alertsEnabled = alert !== false;
  }

  checkTheme() {
    const currentTheme = document.body.getAttribute('color-theme');
    this.isDarkMode = currentTheme === 'dark';
  }

  async loadWeatherByCurrentLocation() {
    try {
      const coords = await this.weatherService.getCurrentLocation();
      await this.loadWeather(coords.lat, coords.lon);
    } catch {
      this.showToast('Failed to get location.');
    }
  }

  async searchWeather() {
    const city = this.searchControl.value;
    if (!city) return this.showToast('Please enter a city name.');

    const loader = await this.loadingCtrl.create({ message: 'Loading weather...', spinner: 'crescent' });
    await loader.present();

    try {
      const geo = await this.weatherService.getGeoByCity(city);
      await this.loadWeather(geo.lat, geo.lon);
    } catch {
      this.showToast('City not found or API failed.');
    } finally {
      await loader.dismiss();
    }
  }

  async loadWeather(lat: number, lon: number) {
    const loader = await this.loadingCtrl.create({
      message: 'Loading weather...',
      spinner: 'crescent'
    });
    await loader.present();

    const online = await this.weatherService.isOnline();

    if (online) {
      try {
        this.currentWeather = await this.weatherService.getWeatherByCoords(lat, lon, this.unitType).toPromise();
        this.currentWeather.flagUrl = `https://flagcdn.com/48x36/${this.currentWeather.sys.country.toLowerCase()}.png`;
        this.currentWeather.advice = this.generateAdvice(this.currentWeather);
        this.backgroundClass = this.getBackgroundClass(this.currentWeather.weather[0].main);

        try {
          const tz = await this.weatherService.getTimeZone(lat, lon);
          const now = new Date();
          const currentTime = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: !this.timeFormat24,
            timeZone: tz
          });
          this.currentWeather.tz = `${tz} (${currentTime})`;

          this.currentWeather.sunrise = new Date(this.currentWeather.sys.sunrise * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: !this.timeFormat24,
            timeZone: tz
          });

          this.currentWeather.sunset = new Date(this.currentWeather.sys.sunset * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: !this.timeFormat24,
            timeZone: tz
          });

        } catch (tzError) {
          console.warn('⚠️ TimeZone fetch failed. Using local device time instead.', tzError);

          this.currentWeather.sunrise = new Date(this.currentWeather.sys.sunrise * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: !this.timeFormat24
          });

          this.currentWeather.sunset = new Date(this.currentWeather.sys.sunset * 1000).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: !this.timeFormat24
          });

          const fallbackNow = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: !this.timeFormat24
          });

          this.currentWeather.tz = `Local Time (${fallbackNow})`;
        }

        const forecastData = await this.weatherService.getForecastByCoords(lat, lon, this.unitType).toPromise() as { list: WeatherItem[] };
        this.forecast = forecastData.list.filter(item => item.dt_txt.includes('12:00:00'));
        this.hourlyForecast = forecastData.list;
        this.hourPage = 1;
        this.updateHourlyPage();

        await this.weatherService.cacheWeatherData('lastWeatherData', {
          currentWeather: this.currentWeather,
          forecast: this.forecast,
          hourlyForecast: this.hourlyForecast
        });

      } catch (err) {
        console.error('Weather load error:', err);
        this.showToast('Failed to load weather data.');
      }

    } else {
      const cached = await this.weatherService.getCachedWeatherData('lastWeatherData');
      if (cached) {
        this.currentWeather = cached.currentWeather;
        this.forecast = cached.forecast;
        this.hourlyForecast = cached.hourlyForecast;
        this.updateHourlyPage();
        this.showToast('Offline Mode: Loaded Cached Weather');
      } else {
        this.showToast('Offline Mode: No Cached Data');
      }
    }

    await loader.dismiss();
  }

  getForecastColor(main: string): string {
    switch (main.toLowerCase()) {
      case 'clear': return 'card-sunny';
      case 'clouds': return 'card-cloudy';
      case 'rain': return 'card-rain';
      case 'snow': return 'card-snow';
      case 'thunderstorm': return 'card-thunder';
      default: return 'card-default';
    }
  }

  updateHourlyPage() {
    const start = 0;
    const end = this.hourPage * this.hourLimit;
    const sliced = this.hourlyForecast.slice(start, end);
    const grouped: { [key: string]: WeatherItem[] } = { AM: [], PM: [] };

    sliced.forEach((item: WeatherItem) => {
      const utcDate = new Date(item.dt_txt);
      const offsetMs = this.currentWeather.timezone * 1000;
      const localDate = new Date(utcDate.getTime() + offsetMs);
      const hour = localDate.getHours();
      const label = hour < 12 ? 'AM' : 'PM';
      item.localTime = localDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      grouped[label].push(item);
    });

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';
    this.hourlyGroups = [
      { period: `AM (${tz})`, data: grouped['AM'] },
      { period: `PM (${tz})`, data: grouped['PM'] }
    ];
  }

  loadMoreHourly() {
    this.hourPage++;
    this.updateHourlyPage();
  }

  canLoadMoreHours(): boolean {
    const flat = [...(this.hourlyGroups[0]?.data || []), ...(this.hourlyGroups[1]?.data || [])];
    return flat.length < this.hourlyForecast.length;
  }

  toggleTimeFormat() {
    this.timeFormat24 = !this.timeFormat24;
    this.loadWeatherByCurrentLocation(); 
  }

  getBackgroundClass(main: string): string {
    switch (main.toLowerCase()) {
      case 'clear': return 'bg-clear';
      case 'clouds': return 'bg-cloudy';
      case 'rain': return 'bg-rain';
      case 'snow': return 'bg-snow';
      case 'thunderstorm': return 'bg-thunder';
      default: return 'default-bg';
    }
  }

  generateAdvice(weather: any): string {
    const desc = weather.weather[0].description;
    const temp = weather.main.temp;
    if (desc.includes('rain')) return '🌧️ Bring an umbrella!';
    if (desc.includes('clear') && temp > 30) return '☀️ Stay hydrated!';
    if (desc.includes('snow')) return '❄️ Bundle up!';
    if (temp <= 15) return '🧥 Wear something warm!';
    return '🌤️ Enjoy your day!';
  }

  toggleUnits() {
    this.isCelsius = !this.isCelsius;
    this.unitType = this.isCelsius ? 'metric' : 'imperial';
    this.weatherService.cacheWeatherData('unit', this.unitType);
    this.loadWeatherByCurrentLocation();
  }

  toggleAlerts() {
    this.alertsEnabled = !this.alertsEnabled;
    this.weatherService.cacheWeatherData('alerts', this.alertsEnabled);
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.weatherService.toggleTheme(this.isDarkMode);
    this.checkTheme();
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
