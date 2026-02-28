import { MapBackgroundLayers } from '../mapBackgroundLayers';
import { svgUrl } from '../mapBackgroundUtils';

export const undeadLayers: MapBackgroundLayers = {
  base: 'linear-gradient(170deg, #0c0a14 0%, #09080f 52%, #07060b 100%)',

  pattern: svgUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' width='70' height='70'>" +
      "<path d='M35,2 L60,14 L66,42 L50,66 L20,66 L4,42 L10,14 Z'" +
        " fill='none' stroke='rgba(138,112,180,0.40)' stroke-width='1.5'/>" +
      "<path d='M35,16 L50,32 L42,56 L28,56 L20,32 Z'" +
        " fill='none' stroke='rgba(118,95,158,0.32)' stroke-width='1'/>" +
      "<line x1='35' y1='2'  x2='35' y2='16' stroke='rgba(158,132,198,0.40)' stroke-width='0.8'/>" +
      "<line x1='60' y1='14' x2='50' y2='32' stroke='rgba(148,122,188,0.36)' stroke-width='0.8'/>" +
      "<line x1='66' y1='42' x2='50' y2='32' stroke='rgba(148,122,188,0.34)' stroke-width='0.8'/>" +
      "<line x1='50' y1='66' x2='42' y2='56' stroke='rgba(138,112,178,0.30)' stroke-width='0.8'/>" +
      "<line x1='4'  y1='42' x2='20' y2='32' stroke='rgba(138,112,178,0.32)' stroke-width='0.8'/>" +
      "<circle cx='10' cy='10' r='4.5' fill='rgba(168,210,232,0.16)'/>" +
      "<circle cx='60' cy='62' r='4'   fill='rgba(148,185,220,0.14)'/>" +
      "<circle cx='35' cy='35' r='3'   fill='rgba(162,142,210,0.12)'/>" +
      "<circle cx='62' cy='14' r='2'   fill='rgba(170,215,235,0.12)'/>" +
    "</svg>"
  ),

  detail: [
    'radial-gradient(ellipse 42% 30% at 22% 30%, rgba(155, 195, 220, 0.28) 0%, transparent 100%)',
    'radial-gradient(ellipse 36% 26% at 78% 68%, rgba(138, 108, 185, 0.26) 0%, transparent 100%)',
    'radial-gradient(ellipse 28% 22% at 50% 50%, rgba(145, 125, 190, 0.20) 0%, transparent 100%)',
  ].join(','),

  haze: [
    'radial-gradient(ellipse 62% 48% at 15% 18%, rgba(155, 198, 222, 0.22) 0%, transparent 100%)',
    'radial-gradient(ellipse 52% 42% at 85% 78%, rgba(138, 108, 188, 0.20) 0%, transparent 100%)',
  ].join(','),

  vignette:
    'radial-gradient(ellipse at center, transparent 40%, rgba(5, 3, 12, 0.58) 100%)',
};