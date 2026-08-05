export const PIXELS_PER_METER = 100;

export const formatUnit = (pixels: number, system: 'metric' | 'imperial'): string => {
  if (system === 'metric') {
    const meters = pixels / PIXELS_PER_METER;
    if (meters < 1) {
      // Return centimeters if less than 1 meter
      return `${(meters * 100).toFixed(0)} cm`;
    }
    return `${meters.toFixed(2)} m`;
  } else {
    // Imperial: 1 meter ~ 3.28084 feet
    const feet = (pixels / PIXELS_PER_METER) * 3.28084;
    if (feet < 1) {
      // Return inches
      return `${(feet * 12).toFixed(1)} in`;
    }
    return `${feet.toFixed(2)} ft`;
  }
}
