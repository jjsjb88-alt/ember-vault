import test from 'node:test';
import assert from 'node:assert/strict';
import {CARDS} from '../dist/engine.js';
import {KEYWORDS,abilityEffects,abilityEffectsMarkup,abilityNotesMarkup} from '../dist/ability-guide.js';

test('all sixty medals render notes and every special rule has a keyword explanation',()=>{for(const id of Object.keys(CARDS)){assert.doesNotThrow(()=>abilityNotesMarkup(id),id);for(const effect of abilityEffects(id)){assert.ok(KEYWORDS[effect.key]?.text,id+' '+effect.key);}}assert.match(abilityNotesMarkup('thunder'),/경계3/);assert.match(abilityEffectsMarkup('surveyor'),/모두/);});
