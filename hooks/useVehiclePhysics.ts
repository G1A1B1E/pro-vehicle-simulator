import { useEffect, useRef } from 'react';
import { EngineProfile, PhysicsState } from '../types';
import { PHYSICS } from '../constants';
import { AudioEngine } from '../services/audioEngine';

export const useVehiclePhysics = (
  engine: EngineProfile,
  audio: AudioEngine,
  active: boolean,
  onUpdate: (state: PhysicsState) => void
) => {
  const state = useRef<PhysicsState>({
    rpm: 0,
    speed: 0,
    gear: 1,
    throttleInput: 0,
    brakeInput: 0,
    clutchEngaged: true,
    isNeutral: false,
    limiterHit: false,
    grinding: false,
    wheelSlip: 0,
    boost: 0,
    gLong: 0,
    engineOn: false,
    cranking: false,
    launchControl: false
  });

  const inputs = useRef({
    throttle: false,
    brake: false,
    clutch: false,
    ignition: false,
  });
  
  const lastTime = useRef<number>(0);
  const limiterTimer = useRef<number>(0);
  const shiftLock = useRef<number>(0);
  const grindTimer = useRef<number>(0);
  const lastThrottle = useRef<number>(0);

  const setInput = (key: 'throttle'|'brake'|'clutch'|'ignition', val: boolean) => {
    inputs.current[key] = val;
  };

  const shift = (dir: number) => {
    if (shiftLock.current > 0) return;

    if (state.current.isNeutral) {
      const nextGear = Math.max(1, Math.min(engine.gearRatios.length, state.current.gear + dir));
      state.current.gear = nextGear;
      shiftLock.current = 0.15;
      audio.triggerShiftThud();
      return;
    }

    const nextGear = Math.max(1, Math.min(engine.gearRatios.length, state.current.gear + dir));
    if (nextGear === state.current.gear) return;

    if (state.current.clutchEngaged) {
      grindTimer.current = 0.5;
      shiftLock.current = 0.3;
      state.current.rpm = Math.max(engine.idleRpm, state.current.rpm - 1500);
      state.current.grinding = true;
    } else {
      state.current.gear = nextGear;
      shiftLock.current = 0.15;
      audio.triggerShiftThud();
    }
  };

  const toggleNeutral = () => {
    state.current.isNeutral = !state.current.isNeutral;
    audio.triggerShiftThud();
  };

  const toggleIgnition = () => {
     if (state.current.engineOn) {
         state.current.engineOn = false;
         state.current.rpm = 0;
     } else {
         inputs.current.ignition = true;
     }
  }

  useEffect(() => {
    let frameId: number;

    const tick = (time: number) => {
      if (!active) return;
      
      const dt = Math.min(0.05, (time - lastTime.current) / 1000);
      lastTime.current = time;

      const s = state.current;
      const inp = inputs.current;

      // --- Timers ---
      shiftLock.current = Math.max(0, shiftLock.current - dt);
      grindTimer.current = Math.max(0, grindTimer.current - dt);
      limiterTimer.current = Math.max(0, limiterTimer.current - dt);
      s.grinding = grindTimer.current > 0;

      // --- Ignition Logic ---
      s.cranking = inp.ignition;
      if (s.cranking && !s.engineOn) {
          s.rpm += 300 * dt; // Starter motor speed
          if (s.rpm > 300) {
              s.engineOn = true;
              s.rpm = engine.idleRpm;
          }
      }
      if (!s.engineOn && !s.cranking) {
          s.rpm = Math.max(0, s.rpm - 500 * dt);
          s.boost = Math.max(0, s.boost - 2 * dt);
      }

      // --- Input Smoothing ---
      if (inp.throttle) s.throttleInput = Math.min(1, s.throttleInput + PHYSICS.THROTTLE_RAMP * dt);
      else s.throttleInput = Math.max(0, s.throttleInput - PHYSICS.THROTTLE_FALL * dt);

      if (inp.brake) s.brakeInput = Math.min(1, s.brakeInput + PHYSICS.BRAKE_RAMP * dt);
      else s.brakeInput = Math.max(0, s.brakeInput - PHYSICS.BRAKE_FALL * dt);

      s.clutchEngaged = !inp.clutch;

      // --- Audio FX Triggers ---
      // Check for rapid throttle lift -> Backfire
      if (lastThrottle.current > 0.8 && s.throttleInput < 0.5 && s.rpm > engine.redlineRpm * 0.6) {
          audio.triggerBackfire();
      }
      // Check for throttle lift while boosted -> Turbo Flutter
      if (lastThrottle.current > 0.5 && s.throttleInput < 0.2 && s.boost > 0.5) {
          audio.triggerTurboFlutter();
      }
      lastThrottle.current = s.throttleInput;

      if (!s.engineOn) {
           const dragForce = PHYSICS.DRAG * s.speed * s.speed;
           const rollForce = PHYSICS.ROLL * (s.speed > 0.1 ? 1 : 0);
           const brakeForce = s.brakeInput * engine.brakeStrength * 12000;
           s.speed = Math.max(0, s.speed - (dragForce + rollForce + brakeForce)/PHYSICS.MASS * dt);
           audio.update(0, 0, engine, 0, false, s.cranking, false);
           onUpdate({...s});
           frameId = requestAnimationFrame(tick);
           return;
      }

      // --- Launch Control Logic ---
      // 1st Gear, Clutch In, Full Throttle = Launch Control
      // Holds RPM at 4000, builds boost
      s.launchControl = s.gear === 1 && !s.clutchEngaged && s.throttleInput > 0.9 && s.speed < 5;
      
      // --- Turbo / Boost Logic ---
      const rpmNorm = (s.rpm - engine.idleRpm) / (engine.maxRpm - engine.idleRpm);
      let targetBoost = engine.turbo ? (1.5 * s.throttleInput * Math.pow(rpmNorm, 0.8)) : 0;
      
      if (s.launchControl) {
          targetBoost = 1.0; // Build boost on launch
      }
      
      if (s.boost < targetBoost) s.boost += (targetBoost - s.boost) * 2 * dt;
      else s.boost += (targetBoost - s.boost) * 5 * dt;

      // --- Limiter ---
      let rpmLimit = engine.redlineRpm;
      if (s.launchControl) rpmLimit = 4500; // Launch Limit

      const overRedline = s.rpm >= rpmLimit;
      if (limiterTimer.current <= 0 && overRedline && s.throttleInput > 0.1) {
        limiterTimer.current = PHYSICS.LIMITER_CUT_TIME;
        if (s.launchControl) audio.triggerBackfire(); // Pops on launch control
      }
      s.limiterHit = limiterTimer.current > 0;
      const effectiveThrottle = s.limiterHit ? 0 : s.throttleInput;

      // --- Drivetrain ---
      const ratio = (!s.isNeutral && s.gear > 0) 
        ? engine.gearRatios[s.gear - 1] * engine.finalDrive 
        : 0;
      
      const wheelCirc = 2 * Math.PI * engine.wheelRadiusM;
      const wheelRpm = (s.speed / wheelCirc) * 60;
      const matchedRpm = Math.max(engine.idleRpm, wheelRpm * ratio);
      
      const drivetrainCoupled = s.clutchEngaged && !s.isNeutral;

      let driveForce = 0;
      let engineBrakeForce = 0;
      
      if (drivetrainCoupled) {
        // Torque Curve + Boost
        const baseTorqueCurve = 1 - Math.pow(Math.abs(rpmNorm - 0.5), 2); 
        const fade = 1 - Math.pow(Math.max(0, (s.rpm - engine.redlineRpm)/(engine.maxRpm-engine.redlineRpm)), 2);
        
        let totalTorque = engine.torque * effectiveThrottle * baseTorqueCurve;
        if (engine.turbo) {
            totalTorque += (s.boost * 150); 
        }

        const wheelTorque = totalTorque * ratio * fade;
        const requestedForce = wheelTorque / engine.wheelRadiusM;
        
        const maxGripForce = PHYSICS.MASS * PHYSICS.TIRE_GRIP_MAX_ACCEL;
        
        if (requestedForce > maxGripForce && s.speed < 50) { 
             driveForce = maxGripForce; 
             s.wheelSlip = Math.min(1, s.wheelSlip + dt * 8); 
             
             const excessTorque = wheelTorque - (maxGripForce * engine.wheelRadiusM);
             const flyWheelEffect = excessTorque * 15 * dt; 
             s.rpm += flyWheelEffect;
        } else {
             driveForce = requestedForce;
             s.wheelSlip = Math.max(0, s.wheelSlip - dt * 5); 
             const stiffness = PHYSICS.CLUTCH_MATCH_RATE;
             s.rpm = s.rpm + (matchedRpm - s.rpm) * (1 - Math.exp(-stiffness * dt));
        }

        const offThrottle = Math.max(0, 1 - effectiveThrottle * 3);
        const ebAmount = offThrottle * (0.2 + 0.8 * rpmNorm);
        engineBrakeForce = engine.engineBrakingStrength * ebAmount * 2500;
      } else {
        s.wheelSlip = 0;
        const freeTarget = engine.idleRpm + effectiveThrottle * (engine.maxRpm - engine.idleRpm);
        s.rpm = s.rpm + (freeTarget - s.rpm) * (1 - Math.exp(-PHYSICS.RPM_RESPONSE * dt));
      }

      s.rpm = Math.max(engine.idleRpm, Math.min(engine.maxRpm, s.rpm));
      if (s.limiterHit) s.rpm -= 3000 * dt;

      const dragForce = PHYSICS.DRAG * s.speed * s.speed;
      const rollForce = PHYSICS.ROLL * (s.speed > 0.1 ? 1 : 0);
      const brakeForce = s.brakeInput * engine.brakeStrength * 12000;

      const netForce = driveForce - dragForce - rollForce - engineBrakeForce - brakeForce;
      const acceleration = netForce / PHYSICS.MASS;
      
      const prevSpeed = s.speed;
      s.speed = Math.max(0, s.speed + acceleration * dt);
      
      const gCalc = (s.speed - prevSpeed) / (dt * 9.81);
      s.gLong = s.gLong + (gCalc - s.gLong) * 0.1;

      // --- Audio Update ---
      const engineLoad = drivetrainCoupled ? effectiveThrottle : 0;
      audio.update(s.rpm, s.throttleInput, engine, engineLoad, s.limiterHit, s.cranking, s.engineOn);

      onUpdate({ ...s });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [engine, active]);

  return { setInput, shift, toggleNeutral, toggleIgnition, state };
};
