// Hit feel for a melee strike: when the blade lands, how long everything freezes (hit-stop),
// how hard the picture shakes, and which pixelfx impact plays. Pure functions so tests can pin them.

/** The swing lasts this long (ms) without a freeze; the blade lands at CONTACT_MS. */
export const SWING_MS = 580;
export const CONTACT_MS = 245;

/**
 * What one strike should feel like.
 * dmg: damage dealt. kill: the blow finished the enemy. maxHp: the enemy's starting hp (for "a big share").
 */
export function hitPlan(dmg = 0, kill = false, maxHp = 0){
 const share = maxHp > 0 ? dmg / maxHp : 0;
 const heavy = kill || dmg >= 4 || share >= .5;
 // freeze: a normal hit holds ~4 frames, a heavy one ~7, a finishing blow ~10
 const stop = kill ? 170 : heavy ? 115 : 70;
 // shake amplitude in stage pixels (stage is 1200 wide)
 const shake = Math.min(22, (kill ? 14 : heavy ? 10 : 6) + dmg * 1.2);
 return {dmg, kill, heavy, stop, shake, fx: heavy ? 'crit' : 'spark', frame: kill};
}

/** Total time (ms) the swing takes once the freeze is added. */
export function swingDuration(plan){return SWING_MS + (plan?.stop || 0);}

/** Animation time for the swing: time runs, holds still for plan.stop at contact, then runs on. */
export function swingClock(elapsed, plan){
 const stop = plan?.stop || 0;
 if(elapsed < CONTACT_MS) return elapsed;
 if(elapsed < CONTACT_MS + stop) return CONTACT_MS;
 return elapsed - stop;
}

/** True while the strike is frozen on contact. */
export function inHitStop(elapsed, plan){return elapsed >= CONTACT_MS && elapsed < CONTACT_MS + (plan?.stop || 0);}

/**
 * Picture offset [x, y] at `since` ms after contact. Strong on the first frames, gone by ~260 ms.
 * Deterministic (no Math.random) so the same hit always shakes the same way.
 */
export function shakeOffset(since, plan, seed = 0){
 if(!plan || since < 0 || since > 260) return [0, 0];
 const k = Math.pow(1 - since / 260, 2) * plan.shake;
 const step = Math.floor(since / 33); // new direction every frame at 30 fps, like a sprite shake
 const a = (step * 2.399 + seed * .7) % (Math.PI * 2);
 // the first frame throws the picture along the blow (to the right)
 if(step === 0) return [Math.round(k), Math.round(-k * .25)];
 return [Math.round(Math.cos(a) * k), Math.round(Math.sin(a) * k * .6)];
}

/** Scale for the damage number: it slams in big on contact and settles. */
export function popScale(since){
 if(since < 0) return 0;
 if(since < 70) return 1.9 - since / 70 * .5;
 if(since < 200) return 1.4 - (since - 70) / 130 * .4;
 return 1;
}

/** Phone vibration pattern for the hit (ms). */
export function vibration(plan){return plan.kill ? [35, 30, 55] : plan.heavy ? [40] : [18];}
