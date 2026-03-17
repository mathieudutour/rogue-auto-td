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

  // Shop panel
  const shopPanelHeight = isMobile ? 100 : 130;
  const shopCardGap = isMobile ? 4 : 10;
  // Calculate card width to fit 5 cards + 2 buttons within the screen width
  const buttonSpace = isMobile ? 90 : 220; // space for left buttons + right start button
  const availableForCards = width - buttonSpace;
  const shopCardWidth = isMobile
    ? Math.min(Math.floor((availableForCards - 4 * shopCardGap) / 5), 100)
    : 140;
  const shopCardHeight = isMobile ? 74 : 100;
  const shopButtonWidth = isMobile ? 44 : 90;
  const shopButtonHeight = isMobile ? 36 : 42;

  // Bench
  const benchSlotSize = isMobile ? 32 : 36;
  const benchSlotGap = isMobile ? 3 : 5;

  // Items
  const itemSlotSize = isMobile ? 22 : 24;
  const itemSlotGap = isMobile ? 3 : 4;
  const itemMaxDisplay = isMobile ? 8 : 10;

  // Vertical layout from bottom:
  // shop panel -> bench -> items
  const benchY = height - shopPanelHeight - benchSlotSize - (isMobile ? 6 : 18);
  const itemY = benchY - itemSlotSize - (isMobile ? 10 : 18);

  return {
    width,
    height,
    isMobile,
    scale,

    hudHeight: isMobile ? 32 : 40,
    hudFontSize: isMobile ? 11 : 14,

    shopPanelHeight,
    shopCardWidth,
    shopCardHeight,
    shopCardGap,
    shopButtonWidth,
    shopButtonHeight,
    shopFontSize: isMobile ? 8 : 11,

    benchSlotSize,
    benchSlotGap,
    benchY,

    itemSlotSize,
    itemSlotGap,
    itemMaxDisplay,
    itemY,

    defaultZoom: isNarrow ? 0.9 : isMobile ? 1.1 : 1.5,

    synergyFontSize: isMobile ? 8 : 10,
    synergyPillWidth: isMobile ? 100 : 130,
    synergySpacing: isMobile ? 17 : 22,
  };
}
