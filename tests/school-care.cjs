'use strict';
const assert = require('node:assert/strict');
const G = require('../dist/campus-jobs.js');

function restore(state) {
  const restored = G.restore(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored, state);
  return restored;
}

function reach(state, ready, preferLowMood = false) {
  for (let turn = 0; turn < 100 && !ready(state); turn++) {
    assert(!state.failed);
    if (state.phase === 'outcome') state = G.next(state);
    else if (state.phase === 'dayEnd') state = G.continueDay(state);
    else {
      assert.equal(state.phase, 'choice');
      const stats = state.stats;
      const score = c => (c.mods.energy || 0) * (stats.energy < 35 ? 4 : 1)
        + (c.mods.health || 0) * (stats.health < 35 ? 6 : 1)
        + (c.mods.mood || 0) * (preferLowMood && stats.mood >= 30 ? -4 : stats.mood < 20 ? 6 : .2)
        + (c.submit ? 200 : 0) + (c.mods.study || 0) * .2 + (c.mods.money || 0) * .2;
      const choices = G.getScene(state).choices.map((c, i) => ({c, i})).filter(({c}) =>
        !c.disabledReason && (c.mods.money || 0) >= -stats.money
        && ['energy', 'health', 'mood', 'study'].every(k => stats[k] + (c.mods[k] || 0) > 2));
      choices.sort((a, b) => score(b.c) - score(a.c));
      assert(choices.length);
      state = G.choose(state, choices[0].i);
    }
  }
  assert(ready(state));
  return restore(state);
}

function checkBooking(dayEnd, key, booked, recovered) {
  assert(dayEnd.school);
  assert.equal(dayEnd.phase, 'dayEnd');
  assert.equal(G.freeMinutes(dayEnd), 0);
  assert.throws(() => G.startActivity(dayEnd, 'job'));
  const pending = restore(G.startActivity(dayEnd, key));
  const scene = G.getScene(pending);
  const cancelled = restore(G.choose(pending, scene.choices.findIndex(c => c.cancel)));
  assert.equal(cancelled.phase, 'dayEnd');
  assert(!booked(cancelled));
  assert.deepEqual(cancelled.stats, dayEnd.stats);
  const index = scene.choices.findIndex(c => !c.cancel && !c.disabledReason && (c.mods.money || 0) >= -pending.stats.money);
  const confirmed = restore(G.choose(pending, index));
  assert.equal(confirmed.phase, 'dayEnd');
  assert(booked(confirmed));
  assert.throws(() => G.startActivity(confirmed, key));
  const next = restore(G.continueDay(confirmed));
  assert.equal(next.day, dayEnd.day + 1);
  assert(recovered(next));
}

const sick = restore(require('./illness.cjs').fixtures().dayEnd);
checkBooking(restore(G.enableSchool(sick, 'cs')), 'clinic', s => s.illness.appointment, s => !s.illness.active);

const bitten = require('./fixtures/v6-character.json').bitten;
const evening = reach(bitten, s => s.phase === 'dayEnd' && s.evolution.bite);
checkBooking(restore(G.enableSchool(evening, 'cs')), 'vaccine', s => s.evolution.bite?.appointment, s => !s.evolution.bite);

const first = G.create(33, ['budget', 'brain', 'athletic'], '课表就诊');
const lowMood = reach(first, s => s.phase === 'dayEnd' && s.stats.mood < 35, true);
checkBooking(lowMood, 'psych', s => s.evolution.psychBooked, s => s.evolution.psychDay === s.day && !s.evolution.psychBooked);

console.log('School care passed: opt-in and new runs, all three evening bookings, cancellation, confirmation, replay, duplicate prevention, and next-morning care.');
