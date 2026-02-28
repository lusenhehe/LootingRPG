import { MapBackgroundLayers } from '../mapBackgroundLayers';
import { svgUrl } from '../mapBackgroundUtils';

export const dungeonLayers: MapBackgroundLayers = {
  base: 'linear-gradient(180deg, #0c0e15 0%, #0a0c12 52%, #08090e 100%)',
  pattern: svgUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='48'>" +
      "<line x1='0' y1='24' x2='64' y2='24' stroke='rgba(0,0,0,0.70)' stroke-width='2'/>" +
      "<line x1='32' y1='0'  x2='32' y2='24' stroke='rgba(0,0,0,0.70)' stroke-width='2'/>" +
      "<line x1='0'  y1='24' x2='0'  y2='48' stroke='rgba(0,0,0,0.70)' stroke-width='2'/>" +
      "<line x1='16' y1='24' x2='16' y2='48' stroke='rgba(0,0,0,0.70)' stroke-width='2'/>" +
      "<line x1='48' y1='24' x2='48' y2='48' stroke='rgba(0,0,0,0.70)' stroke-width='2'/>" +
      "<line x1='2'  y1='2'  x2='30' y2='2'  stroke='rgba(152,162,182,0.28)' stroke-width='1'/>" +
      "<line x1='34' y1='2'  x2='62' y2='2'  stroke='rgba(152,162,182,0.22)' stroke-width='1'/>" +
      "<line x1='2'  y1='26' x2='14' y2='26' stroke='rgba(152,162,182,0.24)' stroke-width='1'/>" +
      "<line x1='18' y1='26' x2='46' y2='26' stroke='rgba(152,162,182,0.26)' stroke-width='1'/>" +
      "<line x1='50' y1='26' x2='62' y2='26' stroke='rgba(152,162,182,0.20)' stroke-width='1'/>" +
      "<rect x='2'  y='2'  width='28' height='20' fill='rgba(140,150,170,0.07)'/>" +
      "<rect x='34' y='2'  width='28' height='20' fill='rgba(130,140,160,0.05)'/>" +
      "<rect x='18' y='26' width='28' height='20' fill='rgba(145,155,175,0.08)'/>" +
    "</svg>"
  ),
  detail: [
    'radial-gradient(ellipse 38% 26% at 28% 52%, rgba(88, 78, 58, 0.30) 0%, transparent 100%)',
    'radial-gradient(ellipse 30% 22% at 72% 48%, rgba(80, 72, 55, 0.25) 0%, transparent 100%)',
    'radial-gradient(ellipse 25% 18% at 50% 20%, rgba(130, 145, 175, 0.22) 0%, transparent 100%)',
  ].join(','),
  haze: [
    'radial-gradient(ellipse 72% 44% at 50% 0%,   rgba(132, 148, 185, 0.22) 0%, transparent 100%)',
    'radial-gradient(ellipse 48% 38% at 12% 88%,  rgba(112,  85,  60, 0.18) 0%, transparent 100%)',
  ].join(','),
  vignette:
    'radial-gradient(ellipse at center, transparent 40%, rgba(4, 5, 14, 0.58) 100%)',
};