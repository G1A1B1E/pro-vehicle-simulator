import { EngineProfile } from './types';

export const PHYSICS = {
  MASS: 1450,
  DRAG: 0.35,
  ROLL: 18.0,
  CLUTCH_MATCH_RATE: 12.0,
  RPM_RESPONSE: 10.0,
  THROTTLE_RAMP: 5.0, 
  THROTTLE_FALL: 6.0,
  BRAKE_RAMP: 5.0,
  BRAKE_FALL: 6.0,
  LIMITER_CUT_TIME: 0.11,
  TIRE_GRIP_MAX_ACCEL: 8.5, 
};

export const ENGINES: EngineProfile[] = [
  {
    id: "v6",
    name: "V6 Sport Turbo",
    idleRpm: 850,
    redlineRpm: 7200,
    maxRpm: 7800,
    torque: 320,
    finalDrive: 3.55,
    gearRatios: [3.25, 2.05, 1.42, 1.08, 0.86, 0.72],
    wheelRadiusM: 0.33,
    engineBrakingStrength: 0.20,
    brakeStrength: 1.05,
    soundProfile: { type: "sport", cylinders: 6, idleLop: 0.10, whistle: 0.4 },
    turbo: true
  },
  {
    id: "v8",
    name: "V8 Supercharged",
    idleRpm: 750,
    redlineRpm: 6500,
    maxRpm: 7000,
    torque: 600, 
    finalDrive: 3.31,
    gearRatios: [2.97, 2.07, 1.43, 1.00, 0.84, 0.56],
    wheelRadiusM: 0.34,
    engineBrakingStrength: 0.25,
    brakeStrength: 1.20,
    soundProfile: { type: "v8", cylinders: 8, idleLop: 0.35, whistle: 0.3 },
    turbo: true
  },
  {
    id: "diesel",
    name: "Turbo Diesel",
    idleRpm: 700,
    redlineRpm: 4500,
    maxRpm: 4800,
    torque: 500,
    finalDrive: 3.90,
    gearRatios: [3.90, 2.20, 1.45, 1.06, 0.79, 0.63],
    wheelRadiusM: 0.33,
    engineBrakingStrength: 0.30,
    brakeStrength: 1.00,
    soundProfile: { type: "diesel", cylinders: 4, idleLop: 0.12, whistle: 0.65 },
    turbo: true
  },
  {
    id: "i4",
    name: "Inline-4 N/A",
    idleRpm: 1000,
    redlineRpm: 8200,
    maxRpm: 9000,
    torque: 200,
    finalDrive: 4.10,
    gearRatios: [3.60, 2.12, 1.56, 1.23, 1.02, 0.88],
    wheelRadiusM: 0.31,
    engineBrakingStrength: 0.15,
    brakeStrength: 1.10,
    soundProfile: { type: "econ", cylinders: 4, idleLop: 0.20, whistle: 0.04 },
    turbo: false
  },
];
