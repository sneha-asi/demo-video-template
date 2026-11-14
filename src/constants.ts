// Single source of truth for canvas + theme. Colors come from config.ts;
// everything else is shared across every video.

export { COLORS } from "./config";
import { COLORS as _COLORS } from "./config";

export const VIDEO_WIDTH  = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS    = 30;

// Re-export individual colors so scenes can `import { ACCENT } from "../constants"`
// without going through the COLORS object every time.
export const BG           = _COLORS.BG;
export const ACCENT       = _COLORS.ACCENT;
export const ACCENT_SOFT  = _COLORS.ACCENT_SOFT;
export const ACCENT_DEEP  = _COLORS.ACCENT_DEEP;
export const TEXT_PRIMARY = _COLORS.TEXT_PRIMARY;
export const TEXT_BODY    = _COLORS.TEXT_BODY;
export const TEXT_MUTED   = _COLORS.TEXT_MUTED;

export const FONT = '"Manrope", -apple-system, BlinkMacSystemFont, sans-serif';
