import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  initPush() {
    console.log('📴 Notifications disabled – no FirebaseX plugin used.');
  }
}
