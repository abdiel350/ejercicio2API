import { Component, OnInit, NgZone } from '@angular/core';
import { IonicModule } from '@ionic/angular';  // Importar IonicModule
import { CommonModule } from '@angular/common';  // Importar CommonModule
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-home',
  imports: [IonicModule, CommonModule], 
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  platformName: string = '';
  isNativePlatform: boolean = false;
  isCameraAvailable: boolean = false;

  deviceInfo: any = {};
  batteryInfo: any = {};
  networkInfo: any = {};
  locationInfo: any = {};

  eventLogs: string[] = [];

  constructor(private ngZone: NgZone) {}

  async ngOnInit() {
    await this.getPlatformInfo();
    await this.checkCameraAvailability();
    await this.getDeviceInfo();
    await this.getBatteryInfo();
    await this.getNetworkInfo();
    await this.getLocationInfo();

    this.setupNetworkListener();
    this.setupAppListeners();
  }

  async getPlatformInfo() {
    const info = await Device.getInfo();
    this.platformName = info.platform;
    this.isNativePlatform = Capacitor.isNativePlatform();
  }

  async checkCameraAvailability() {
    try {
      const photo = await Camera.getPhoto({
        quality: 50,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
      });
      this.isCameraAvailable = true;
    } catch (error) {
      this.isCameraAvailable = false;
    }
  }

  async getDeviceInfo() {
    try {
      const info: any = await Device.getInfo();
      this.deviceInfo.name = info.model;
      this.deviceInfo.operatingSystem = info.platform;
      this.deviceInfo.osVersion = info.osVersion;
      this.deviceInfo.manufacturer = info.manufacturer;
      this.deviceInfo.isVirtual = info.isVirtual;
      this.deviceInfo.uuid = info.uuid;

      console.log('Device UUID:', this.deviceInfo.uuid); 
    } catch (error) {
      console.error('Error obteniendo información del dispositivo:', error);
    }
  }

  async getBatteryInfo() {
    const batteryInfo = await Device.getBatteryInfo();
    this.batteryInfo.level = batteryInfo.batteryLevel;
    this.batteryInfo.isCharging = batteryInfo.isCharging;
  }

  async getNetworkInfo() {
    const status = await Network.getStatus();
    this.networkInfo.isConnected = status.connected;
    this.networkInfo.connectionType = status.connectionType;
    this.addEventLog(`Inicial tipo conexión: ${status.connectionType}`);
  }

  async getLocationInfo() {
    try {
      const position = await Geolocation.getCurrentPosition();
      this.locationInfo.latitude = position.coords.latitude;
      this.locationInfo.longitude = position.coords.longitude;
    } catch (error) {
      console.error('Error obteniendo la ubicación:', error);
    }
  }

  setupNetworkListener() {
    Network.addListener('networkStatusChange', (status) => {
      this.ngZone.run(() => {
        this.networkInfo.isConnected = status.connected;
        this.networkInfo.connectionType = status.connectionType;
        this.addEventLog(`Cambio tipo conexión a ${status.connectionType}`);
      });
    });
  }

  setupAppListeners() {
    App.addListener('appStateChange', (state) => {
      this.ngZone.run(() => {
        if (state.isActive) {
          this.addEventLog('onStart');
        } else {
          this.addEventLog('onStop');
        }
      });
    });

    App.addListener('resume', () => {
      this.ngZone.run(() => {
        this.addEventLog('onResume');
      });
    });

    App.addListener('pause', () => {
      this.ngZone.run(() => {
        this.addEventLog('onPause');
      });
    });
  }

  addEventLog(message: string) {
    this.eventLogs.push(message);
    console.log(message); 
}
}