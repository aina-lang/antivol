import { BleManager, Device } from 'react-native-ble-plx';

class BLEScannerService {
  private manager: BleManager | null = null;
  private isScanning = false;

  getManager(): BleManager {
    if (!this.manager) {
      this.manager = new BleManager();
    }
    return this.manager;
  }

  // Démarrer un scan d'une durée spécifique (en ms)
  async scanForLostDevices(
    durationMs: number,
    onDeviceFound: (device: Device) => void
  ): Promise<void> {
    if (this.isScanning) {
      console.log('Scan BLE déjà en cours, annulation du lancement concurrent.');
      return;
    }

    const manager = this.getManager();
    this.isScanning = true;

    return new Promise((resolve) => {
      console.log(`Lancement du scan BLE actif pour ${durationMs}ms...`);

      manager.startDeviceScan(
        null, // Scanner tous les UUIDs de services
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.warn('Erreur rencontrée lors du scan BLE:', error.message);
            this.isScanning = false;
            resolve();
            return;
          }

          if (device) {
            onDeviceFound(device);
          }
        }
      );

      // Stopper le scan après le délai imparti
      setTimeout(() => {
        try {
          manager.stopDeviceScan();
          console.log('Fin du scan BLE actif.');
        } catch (e) {
          console.warn('Erreur lors de l’arrêt du scan BLE:', e);
        } finally {
          this.isScanning = false;
          resolve();
        }
      }, durationMs);
    });
  }

  // Obtenir l'état actuel du Bluetooth
  async checkBluetoothState(): Promise<string> {
    const manager = this.getManager();
    try {
      return await manager.state();
    } catch {
      return 'Unknown';
    }
  }
}

export const bleScannerService = new BLEScannerService();
export type { Device };
