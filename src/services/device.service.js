import { deviceRepository } from '../repositories/device.repository.js';

async function recordTelemetry(deviceId, data) {
  await deviceRepository.recordTelemetry(deviceId, data);

  console.log(
    `[telemetry] ${deviceId} | state=${data.state} | rssi=${data.rssi}dBm | uptime=${data.uptime_s}s`,
  );
}

export const deviceService = {
  recordTelemetry,
};
