export interface EngineProfile {
  id: string;
  name: string;
  idleRpm: number;
  redlineRpm: number;
  maxRpm: number;
  torque: number;
  finalDrive: number;
  gearRatios: number[];
  wheelRadiusM: number;
  engineBrakingStrength: number;
  brakeStrength: number;
  soundProfile: SoundProfile;
  turbo?: boolean;
}

export interface SoundProfile {
  type: 'v8' | 'diesel' | 'sport' | 'econ';
  cylinders: number;
  idleLop: number;
  whistle: number;
}

export interface InputState {
  throttle: boolean;
  brake: boolean;
  clutch: boolean;
  shiftUp: boolean;
  shiftDown: boolean;
  neutral: boolean;
  ignition: boolean;
}

export interface PhysicsState {
  rpm: number;
  speed: number; // m/s
  gear: number;
  throttleInput: number; // 0-1 (smoothed)
  brakeInput: number; // 0-1 (smoothed)
  clutchEngaged: boolean;
  isNeutral: boolean;
  limiterHit: boolean;
  grinding: boolean;
  wheelSlip: number; // 0 to 1
  boost: number; // Bar
  gLong: number; // Longitudinal G-Force
  engineOn: boolean;
  cranking: boolean;
  launchControl: boolean; // Visual flag for HUD
}
