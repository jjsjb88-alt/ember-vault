// Minimal glint helper from pixelfx pickups/_lib.js (MIT; see ../../NOTICE.md).
import {WHITE,scale} from "../../core/index.js";

/** A four-point star glint: arms of arm px in c, dimmer tips, a white heart, its own light. */
export function glint(p, x, y, arm, c, k = 0.4, tip = scale(c, 0.8)) {
  const n = Math.round(arm), X = Math.floor(x), Y = Math.floor(y);
  if (n < 0) return;
  for (let d = 1; d <= n; d++) {
    const cc = d === n && n > 1 ? tip : c;
    p.px(X + d, Y, cc), p.px(X - d, Y, cc), p.px(X, Y + d, cc), p.px(X, Y - d, cc);
  }
  p.px(X, Y, n > 0 ? WHITE : c);
  p.glow(X + 0.5, Y + 0.5, 3 + n * 2.5, c, k);
}

