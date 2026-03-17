/**
 * Responsive layout helpers for mobile/desktop adaptation.
 * All UI components should use these to compute sizes and positions.
 */

export interface LayoutMetrics {
  width: number;
  height: number;
  isMobile: boolean;
  scale: number; // 1.0 on desktop, <1 on mobile

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

export function getLayout(width: number, height: number): LayoutMetrics {
  const isMobile = width < 600;
  const isNarrow = width < 480;
  const scale = isMobile ? Math.max(width / 600, 0.55) : 1;

  // Shop panel — taller on mobile so it's visible above browser chrome
  const shopPanelHeight = isMobile ? 140 : 130;
  const shopCardGap = isMobile ? 4 : 10;
  const shopButtonWidth = isMobile ? 52 : 90;
  const shopButtonHeight = isMobile ? 40 : 42;
  // Cards fill remaining width
  const shopCardWidth = isMobile
    ? Math.floor((width - 8 - 4 * shopCardGap) / 5)
    : 140;
  const shopCardHeight = isMobile ? 80 : 100;
  const shopFontSize = isMobile ? 10 : 11;

  // Bench — bigger touch targets on mobile
  const benchSlotSize = isMobile ? 36 : 36;
  const benchSlotGap = isMobile ? 3 : 5;

  // Items — bigger on mobile for touch
  const itemSlotSize = isMobile ? 28 : 24;
  const itemSlotGap = isMobile ? 4 : 4;
  const itemMaxDisplay = isMobile ? 8 : 10;

  // Vertical layout from bottom:
  // shop panel -> bench -> items
  const benchY = height - shopPanelHeight - benchSlotSize - (isMobile ? 8 : 18);
  const itemY = benchY - itemSlotSize - (isMobile ? 12 : 18);

  return {
    width,
    height,
    isMobile,
    scale,

    hudHeight: isMobile ? 36 : 40,
    hudFontSize: isMobile ? 14 : 14,

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

    defaultZoom: isNarrow ? 0.9 : isMobile ? 1.1 : 1.5,

    synergyFontSize: isMobile ? 10 : 10,
    synergyPillWidth: isMobile ? 110 : 130,
    synergySpacing: isMobile ? 20 : 22,
  };
}
