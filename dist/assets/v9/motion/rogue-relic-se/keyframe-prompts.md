# Rogue SE relic discovery: identity and key-pose briefs

Source: dist/assets/rogue-walk-v5.png, WALK_FRAMES[0][1] (SE), crop x202 y36 w152 h245. Source cropped without painting; standardized using 2dimg2motion standardize_baseline.py to 360px subject and padded by translation to 768x768. Baseline alpha bounds x272..494,y204..563. All endpoint pixels remain exact.

Identity: adult female human rogue, slender athletic proportions; long flowing near-black hair swept toward screen-left, pale warm face in three-quarter SE view, eyes looking screen-right; teal cloak over black leather/charcoal fitted armor with gold edges, clasp, waist belts, gold-trimmed knee-high boots; visible upper chest exactly as source, no new exposure. Two legs and two arms only. Preserve existing shaded pixel-paint sprite texture, dark outline and warm-gold highlights.

Topology: coordinateSpace=screen-space. activeLimb=screen-right hand and its screen-right shoulder, which owns the brass lantern. anchorLimb=screen-left sword arm, attached to screen-left shoulder throughout. activeWeapon=none for this non-combat action. weaponHand=screen-left, silver short dagger down and outward throughout. carriedProp=brass lantern always suspended from the same screen-right hand/wrist loop; small cyan diamond relic acquired by same screen-right palm at frame05, lifted at08, stowed at11. No hand/weapon swap. Passive accessories: teal cape, long black hair, belt pouches. Artifact is intentionally added only at contact, never a detached magical effect. Magenta is absent from body/metal/highlight palette.

Canvas: final frame512x512, grounded boot bottom y436; anchor (287,436). Reference-only padded canvas768x768. Baseline apparent body height360 (never full-cell). Initial request: four poses in one1536x1536 source sheet with equal768x768 cells; actual model output1254x1254 with four627x627 cells, no borders or text, flat #ff00ff backdrop. Same proportions and camera, generous gutters, no per-frame auto-fit.

02 anticipation: Notice relic ahead; head tilts down slightly, knees bend modestly, torso leans screen-right. Right hand lowers with lantern handle still attached; palm begins extending forward. Left sword hand remains at hip, blade angled down-screen-left, fully visible. Body retains original side.
05 contact: Torso bends and knees compress naturally while both boots stay at original base. Same right hand reaches furthest down-screen-right and cups a small cyan diamond relic; brass lantern remains hanging from that wrist/handle underneath and beside the palm. Left arm stays attached and anchors the down-left blade. No floor or pedestal.
08 lift: Torso straightens to original height. Same right hand lifts cyan relic to upper-chest/eye level while lantern stays suspended below that wrist. Head looks at relic, satisfied restrained expression. Left dagger hand remains steady at original side, no duplicate hands.
11 recovery: Relic is placed into the existing belt pouch by the right hand, then right hand/lantern lifts back toward original lantern position. Torso nearly neutral and facing SE; left weapon arm is unchanged. Artifact is mostly or entirely occluded inside pouch and absent by endpoint13.

Model-generated whole-character artwork only; local operations limited to chroma removal, cell splitting, one shared scaling/alignment, packing, preview and validation.

## Executed model calls and review

- First four-keypose sheet referenced the standardized baseline. It was rejected for rounded/bulky proportions.
- Accepted keypose regeneration referenced both the standardized baseline and original152x245 crop. The shared identity and four briefs above were retained, with explicit adult slender proportions, small mature face, long legs, same teal cloak and exact prop ownership. All four keyposes were generated in one call.
- In-between batch A referenced baseline, original crop, and approved keypose sheet. Requested row order01,03,04,06; visual curation swapped the two depth intermediates to01,04,03,06 source order so final03 then04 deepen the crouch monotonically. No pixels were redrawn for this ordering.
- In-between batch B used the same three references. Row order07,09,10,12.
- Each in-between prompt fixed 1254x1254 source, four equal627x627 cells, standing body435px/foot bottom510 within cell, flatmagenta background and generous gutters, no labels, scenery, shadow or detached effects.
- All generated cells share the same515/627 scale, fixed horizontal translation15px, and whole-cell vertical alignment to foot436; no per-frame auto-fit, limb rotation, warp, or interpolation.

## In-between prompts

Shared: exactly four whole-character intermediate frames in a2x2 grid. Reference1 is exact baseline, reference2 original close crop, reference3 approved keys TL02/TR05/BL08/BR11. Do not redraw/output anchors. Preserve adult slender proportions, mature small face, long black hair swept screen-left, teal cloak, charcoal leather and gold trim, original shaded sprite texture and SE view. Exactly two arms/hands/boots. Screen-left dagger remains down-left from the same shoulder; screen-right brass lantern hangs from that wrist/handle, and the same palm owns the cyan relic. No additional hand, swapping, redesign, chibi proportions or bulky anatomy. Same character scale and camera in every cell. Flat #FF00FF everywhere outside the character.

A01: halfway00→02, tiny knee bend and forward lean, lantern hand lowers/opens, no diamond; rear boot begins to settle.
A03 requested: one-third02→05, torso bends more and right palm reaches farther down, no gem.
A04 requested: two-thirds02→05, almost deepest crouch, palm about to cup, gem not yet present.
A06: one-third05→08, right palm and gem rise from low waist toward mid-chest, torso partly straightens, lantern hangs below wrist.
B07: two-thirds05→08, torso almost straight, gem reaches upper chest, lantern remains below same wrist.
B09: one-third08→11, lower gem toward existing belt pouch, gem visible.
B10: two-thirds08→11, same palm puts gem into existing pouch, mostly occluded, lantern remains on wrist.
B12: halfway11→13 exact baseline; no gem, lantern nearly original position, rear boot lifted, hair/cape return.
