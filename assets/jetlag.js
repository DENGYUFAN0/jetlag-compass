/*!
 * jetlag-compass — circadian re-entrainment engine.
 * Dependency-free; runs in the browser (window.JETLAG) and Node (require).
 *
 * Based on the light Phase Response Curve (PRC): light AFTER your core-body-
 * temperature minimum (~2h before habitual wake) ADVANCES the clock; light
 * BEFORE it DELAYS the clock. We translate that into get-light / avoid-light
 * windows and a day-by-day sleep schedule in DESTINATION local time.
 *
 * Educational planning aid, NOT medical advice. MIT License.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.JETLAG = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function num(v, d) { v = Number(v); return isFinite(v) ? v : (d === undefined ? 0 : d); }
  function mod(n, m) { return ((n % m) + m) % m; }
  function parseTime(s) {
    if (typeof s !== 'string') return 0;
    var p = s.split(':');
    return mod(num(p[0]) * 60 + num(p[1] || 0), 1440);
  }
  function fmtTime(min) {
    min = mod(Math.round(min), 1440);
    var h = Math.floor(min / 60), m = min % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  /** Normalized signed timezone shift in hours, range (-12, 12].
   *  Positive => destination is AHEAD of home (you must ADVANCE your clock). */
  function normalizeShift(homeOffset, destOffset) {
    var raw = num(destOffset) - num(homeOffset);
    while (raw > 12) raw -= 24;
    while (raw <= -12) raw += 24;
    return raw;
  }

  /** Light windows + sleep targets for one adjustment day (destination time). */
  function dayPlan(d, bedMin, wakeMin, recDir) {
    var get = null, avoid = null, note = '';
    if (recDir === 'advance') {
      get = [fmtTime(wakeMin), fmtTime(wakeMin + 150)];     // bright light ~2.5h after waking
      avoid = [fmtTime(bedMin - 180), fmtTime(bedMin)];     // dim the last 3h before bed
      note = 'advance';
    } else if (recDir === 'delay') {
      get = [fmtTime(bedMin - 180), fmtTime(bedMin - 30)];  // bright light in the evening
      avoid = [fmtTime(wakeMin), fmtTime(wakeMin + 150)];   // keep the first ~2.5h after waking dim
      note = 'delay';
    }
    return { day: d, bedtime: fmtTime(bedMin), wake: fmtTime(wakeMin), lightGet: get, lightAvoid: avoid, dir: note };
  }

  function preTrip(startDaysBefore, recDir, rate) {
    var n = Math.max(0, Math.min(7, Math.round(num(startDaysBefore, 0))));
    if (n === 0 || recDir === 'none') return null;
    return { days: n, perDayHours: rate, direction: recDir };
  }

  /**
   * Build a full re-entrainment plan.
   * @param {{homeOffset:number,destOffset:number,bedtime:string,waketime:string,startDaysBefore:number}} o
   */
  function plan(o) {
    o = o || {};
    var shift = normalizeShift(o.homeOffset, o.destOffset);
    var mag = Math.abs(shift);
    var dir = shift > 0 ? 'advance' : (shift < 0 ? 'delay' : 'none');

    // Large eastward (advance) shifts: delaying "the long way" is usually easier.
    var recDir = dir, recMag = mag, flipped = false;
    if (dir === 'advance' && mag > 9) { recDir = 'delay'; recMag = 24 - mag; flipped = true; }

    var rate = recDir === 'delay' ? 1.5 : 1.0;            // hours/day the clock can move
    var days = mag === 0 ? 0 : Math.max(1, Math.ceil(recMag / rate));

    var homeBed = parseTime(o.bedtime || '23:00');
    var homeWake = parseTime(o.waketime || '07:00');
    var sleepLen = mod(homeWake - homeBed, 1440);

    // Where the body "wants" to sleep on arrival, in DESTINATION local time.
    var arrivalBed = mod(homeBed + shift * 60, 1440);
    var stepSign = recDir === 'delay' ? 1 : -1;           // delay = later(+), advance = earlier(-)
    var totalMove = recMag * 60;

    var schedule = [];
    for (var d = 1; d <= days; d++) {
      var covered = Math.min(d * rate * 60, totalMove);
      var tBed = mod(arrivalBed + stepSign * covered, 1440);
      schedule.push(dayPlan(d, tBed, mod(tBed + sleepLen, 1440), recDir));
    }
    if (schedule.length) { // land exactly on the home routine on the final day
      var last = schedule[schedule.length - 1];
      last.bedtime = fmtTime(homeBed); last.wake = fmtTime(homeWake);
    }

    return {
      shiftHours: shift,
      magnitude: mag,
      directionNeeded: dir,                 // what the timezone change demands
      recommendedDirection: recDir,         // what we actually do (may flip for ease)
      flippedForEase: flipped,
      ratePerDay: rate,
      daysToAdjust: days,
      destArrivalBedtime: fmtTime(arrivalBed),
      homeBedtime: fmtTime(homeBed),
      homeWake: fmtTime(homeWake),
      schedule: schedule,
      preTrip: preTrip(o.startDaysBefore, recDir, rate)
    };
  }

  return { normalizeShift: normalizeShift, plan: plan, parseTime: parseTime, fmtTime: fmtTime };
});
