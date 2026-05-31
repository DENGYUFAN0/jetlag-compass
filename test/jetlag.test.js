'use strict';
const test = require('node:test');
const assert = require('node:assert');
const J = require('../assets/jetlag.js');

test('normalizeShift wraps into (-12, 12] and signs correctly', () => {
  assert.strictEqual(J.normalizeShift(0, 8), 8);    // home UTC, dest +8 -> advance 8
  assert.strictEqual(J.normalizeShift(8, 0), -8);   // -> delay 8
  assert.strictEqual(J.normalizeShift(8, -5), 11);  // -13 wraps to +11
  assert.strictEqual(J.normalizeShift(-5, 9), -10); // 14 wraps to -10
  assert.strictEqual(J.normalizeShift(8, 8), 0);    // same zone
  assert.strictEqual(J.normalizeShift(5.5, 9.5), 4);// half-hour zones
});

test('direction: ahead -> advance, behind -> delay', () => {
  assert.strictEqual(J.plan({ homeOffset: 0, destOffset: 6 }).directionNeeded, 'advance');
  assert.strictEqual(J.plan({ homeOffset: 0, destOffset: -6 }).directionNeeded, 'delay');
  assert.strictEqual(J.plan({ homeOffset: 8, destOffset: 8 }).directionNeeded, 'none');
});

test('large eastward shift flips to delay-the-long-way', () => {
  const p = J.plan({ homeOffset: 0, destOffset: 11 }); // advance 11 -> flip
  assert.strictEqual(p.directionNeeded, 'advance');
  assert.strictEqual(p.recommendedDirection, 'delay');
  assert.strictEqual(p.flippedForEase, true);
});

test('moderate shift keeps its natural direction', () => {
  const p = J.plan({ homeOffset: 0, destOffset: 6 });
  assert.strictEqual(p.recommendedDirection, 'advance');
  assert.strictEqual(p.flippedForEase, false);
});

test('daysToAdjust ~ magnitude / rate', () => {
  assert.strictEqual(J.plan({ homeOffset: 0, destOffset: 6 }).daysToAdjust, 6);   // 6h advance @1/day
  assert.strictEqual(J.plan({ homeOffset: 0, destOffset: -6 }).daysToAdjust, 4);  // 6h delay @1.5/day
  assert.strictEqual(J.plan({ homeOffset: 8, destOffset: 8 }).daysToAdjust, 0);   // no shift
});

test('schedule converges to the home routine on the final day', () => {
  for (const dest of [6, -6, 11, -10, 3]) {
    const p = J.plan({ homeOffset: 0, destOffset: dest, bedtime: '23:00', waketime: '07:00' });
    const last = p.schedule[p.schedule.length - 1];
    assert.strictEqual(last.bedtime, '23:00', `dest ${dest} final bedtime`);
    assert.strictEqual(last.wake, '07:00', `dest ${dest} final wake`);
  }
});

test('every scheduled day has light windows in the recommended direction', () => {
  const p = J.plan({ homeOffset: 0, destOffset: -8 }); // delay
  assert.ok(p.schedule.length > 0);
  for (const day of p.schedule) {
    assert.ok(day.lightGet && day.lightAvoid);
    assert.strictEqual(day.dir, 'delay');
  }
});

test('no-shift produces an empty schedule and no pre-trip', () => {
  const p = J.plan({ homeOffset: 3, destOffset: 3, startDaysBefore: 3 });
  assert.strictEqual(p.schedule.length, 0);
  assert.strictEqual(p.preTrip, null);
});

test('pre-trip guidance appears only when requested', () => {
  assert.strictEqual(J.plan({ homeOffset: 0, destOffset: 6 }).preTrip, null);
  const p = J.plan({ homeOffset: 0, destOffset: 6, startDaysBefore: 3 });
  assert.strictEqual(p.preTrip.days, 3);
  assert.strictEqual(p.preTrip.direction, 'advance');
});

test('time helpers round-trip', () => {
  assert.strictEqual(J.fmtTime(J.parseTime('07:30')), '07:30');
  assert.strictEqual(J.fmtTime(J.parseTime('23:45')), '23:45');
  assert.strictEqual(J.fmtTime(-30), '23:30');   // wraps
  assert.strictEqual(J.fmtTime(1500), '01:00');
});
