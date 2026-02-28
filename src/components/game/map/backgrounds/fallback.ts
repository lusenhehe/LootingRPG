import { MapBackgroundLayers } from '../mapBackgroundLayers';
import { svgUrl } from '../mapBackgroundUtils';

export const fallbackLayers: MapBackgroundLayers = {
  base: 'linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%)',
  pattern: svgUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>" +
      "<line x1='0' y1='20' x2='40' y2='20' stroke='rgba(160,160,160,0.20)' stroke-width='1'/>" +
      "<line x1='20' y1='0' x2='20' y2='40' stroke='rgba(160,160,160,0.20)' stroke-width='1'/>" +
    "</svg>"
  ),
  detail: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(180, 180, 180, 0.14) 0%, transparent 100%)',
  haze:   'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(160, 160, 160, 0.10) 0%, transparent 100%)',
  vignette: 'radial-gradient(ellipse at center, transparent 42%, rgba(0, 0, 0, 0.50) 100%)',
};
