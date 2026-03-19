/**
 * Responsive layout helpers for mobile/desktop adaptation.
 * All UI components should use these to compute sizes and positions.
 *
 * The game canvas may render at native device resolution (DPR-scaled).
 * Breakpoints use CSS dimensions for consistency across devices, but all
 * output pixel values are in game (physical) coordinates.
 */

export interface LayoutMetrics {
  width: number;
  height: number;
  isMobile: boolean;
  scale: number; // 1.0 on desktop, <1 on mobile
  dpr: number;   // device pixel ratio the game is rendering at

  // HUD
  hudHeight: number;
  hudFontSize: number;

  // Shop panel
  shopPanelHeight: number;
  shopCardWidth: number;
  shopCardHeight: number;
  shopCardGap: number;
  shopButtonWidth: number;
  shopButtonHeight: number;
  shopFontSize: number;

  // Bench
  benchSlotSize: number;
  benchSlotGap: number;
  benchY: number;

  // Items
  itemSlotSize: number;
  itemSlotGap: number;
  itemMaxDisplay: number;
  itemY: number;

  // Camera
  defaultZoom: number;

  // Synergy bar
  synergyFontSize: number;
  synergyPillWidth: number;
  synergySpacing: number;
}

/** Device pixel ratio used for game rendering (capped at 3). */
export function getDpr(): number {
  return Math.min(window.devicePixelRatio || 1, 3);
}

export function getLayout(width: number, height: number): LayoutMetrics {
  // The canvas may be DPR-scaled; use CSS dimensions for breakpoints
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const cssW = width / dpr;
  const cssH = height / dpr;

  const isMobile = cssW < 600;
  const isNarrow = cssW < 480;
  const scale = isMobile ? Math.max(cssW / 600, 0.55) : 1;

  // Helper: scale a CSS-pixel value to game coordinates
  const s = (v: number) => Math.round(v * dpr);

  // Shop panel — taller on mobile so it's visible above browser chrome
  const shopPanelHeight = s(isMobile ? 140 : 130);
  const shopCardGap = s(isMobile ? 4 : 10);
  const shopButtonWidth = s(isMobile ? 52 : 90);
  const shopButtonHeight = s(isMobile ? 40 : 42);
  // Cards fill remaining width
  const shopCardWidth = isMobile
    ? Math.floor((width - s(8) - 4 * shopCardGap) / 5)
    : s(140);
  const shopCardHeight = s(isMobile ? 80 : 100);
  const shopFontSize = s(isMobile ? 10 : 11);

  // Bench — bigger touch targets on mobile
  const benchSlotSize = s(isMobile ? 36 : 36);
  const benchSlotGap = s(isMobile ? 3 : 5);

  // Items — bigger on mobile for touch
  const itemSlotSize = s(isMobile ? 28 : 24);
  const itemSlotGap = s(isMobile ? 4 : 4);
  const itemMaxDisplay = isMobile ? 8 : 10;

  // Vertical layout from bottom:
  // shop panel -> bench -> items
  const benchY = height - shopPanelHeight - benchSlotSize - s(isMobile ? 8 : 18);
  const itemY = benchY - itemSlotSize - s(isMobile ? 12 : 18);

  return {
    width,
    height,
    isMobile,
    scale,
    dpr,

    hudHeight: s(isMobile ? 36 : 40),
    hudFontSize: s(isMobile ? 14 : 14),

    shopPanelHeight,
    shopCardWidth,
    shopCardHeight,
    shopCardGap,
    shopButtonWidth,
    shopButtonHeight,
    shopFontSize,

    benchSlotSize,
    benchSlotGap,
    benchY,

    itemSlotSize,
    itemSlotGap,
    itemMaxDisplay,
    itemY,

    defaultZoom: (isNarrow ? 0.9 : isMobile ? 1.1 : 1.5) * dpr,

    synergyFontSize: s(isMobile ? 10 : 10),
    synergyPillWidth: s(isMobile ? 110 : 130),
    synergySpacing: s(isMobile ? 20 : 22),
  };
}
