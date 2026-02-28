import { MapBackgroundLayers } from '../mapBackgroundLayers';
import { svgUrl } from '../mapBackgroundUtils';

export const volcanoLayers: MapBackgroundLayers = {
  base:
    'linear-gradient(188deg, #1b0603 0%, #180503 20%, #150403 45%, #110302 72%, #0c0201 88%, #080101 100%)',
  pattern: svgUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>" +
      "<defs>" +
        "<linearGradient id='vc1' x1='0%' y1='0%' x2='100%' y2='0%'>" +
          "<stop offset='0%'   stop-color='#6b1400' stop-opacity='0.28'/>" +
          "<stop offset='28%'  stop-color='#ff4a00' stop-opacity='0.72'/>" +
          "<stop offset='52%'  stop-color='#ff8a2b' stop-opacity='0.92'/>" +
          "<stop offset='76%'  stop-color='#ff4a00' stop-opacity='0.65'/>" +
          "<stop offset='100%' stop-color='#6b1400' stop-opacity='0.20'/>" +
        "</linearGradient>" +
        "<linearGradient id='vc2' x1='0%' y1='0%' x2='100%' y2='100%'>" +
          "<stop offset='0%'   stop-color='#6b1400' stop-opacity='0.22'/>" +
          "<stop offset='45%'  stop-color='#ff4a00' stop-opacity='0.58'/>" +
          "<stop offset='100%' stop-color='#6b1400' stop-opacity='0.18'/>" +
        "</linearGradient>" +
        "<linearGradient id='vc3' x1='0%' y1='0%' x2='100%' y2='0%'>" +
          "<stop offset='0%'   stop-color='#6b1400' stop-opacity='0.15'/>" +
          "<stop offset='50%'  stop-color='#ff4a00' stop-opacity='0.45'/>" +
          "<stop offset='100%' stop-color='#6b1400' stop-opacity='0.12'/>" +
        "</linearGradient>" +
        "<filter id='cg' x='-30%' y='-30%' width='160%' height='160%'>" +
          "<feGaussianBlur stdDeviation='2.2' result='blur'/>" +
          "<feMerge>" +
            "<feMergeNode in='blur'/>" +
            "<feMergeNode in='SourceGraphic'/>" +
          "</feMerge>" +
        "</filter>" +
        "<filter id='cgs' x='-20%' y='-20%' width='140%' height='140%'>" +
          "<feGaussianBlur stdDeviation='1.2' result='blur'/>" +
          "<feMerge>" +
            "<feMergeNode in='blur'/>" +
            "<feMergeNode in='SourceGraphic'/>" +
          "</feMerge>" +
        "</filter>" +
      "</defs>" +
      "<rect width='160' height='160' fill='#150403'/>" +
      "<circle cx='14'  cy='28'  r='3.5' fill='rgba(42,8,2,0.92)'/>" +
      "<circle cx='44'  cy='10'  r='2'   fill='rgba(36,6,2,0.85)'/>" +
      "<circle cx='80'  cy='38'  r='4.5' fill='rgba(52,10,3,0.90)'/>" +
      "<circle cx='118' cy='18'  r='2.8' fill='rgba(40,7,2,0.82)'/>" +
      "<circle cx='96'  cy='68'  r='3.2' fill='rgba(46,9,3,0.88)'/>" +
      "<circle cx='148' cy='102' r='2.2' fill='rgba(36,6,2,0.80)'/>" +
      "<circle cx='22'  cy='90'  r='4'   fill='rgba(50,10,3,0.86)'/>" +
      "<circle cx='68'  cy='132' r='2.5' fill='rgba(42,8,2,0.78)'/>" +
      "<circle cx='136' cy='52'  r='3'   fill='rgba(38,7,2,0.84)'/>" +
      "<circle cx='6'   cy='55'  r='2'   fill='rgba(48,9,3,0.80)'/>" +
      "<circle cx='155' cy='140' r='3.5' fill='rgba(40,8,2,0.76)'/>" +
      "<ellipse cx='62'  cy='45'  rx='8'  ry='3'   fill='rgba(107,20,0,0.22)'/>" +
      "<ellipse cx='112' cy='98'  rx='6'  ry='2.5' fill='rgba(95,18,0,0.18)'/>" +
      "<ellipse cx='30'  cy='118' rx='5'  ry='2'   fill='rgba(85,16,0,0.16)'/>" +
      "<path d='M12,54 L26,45 L34,56 L48,42 L60,52 L72,38 L84,48 L98,33 L112,44 L124,30 L138,40 L150,35'" +
        " fill='none' stroke='url(#vc1)' stroke-width='3.5' stroke-linecap='round' filter='url(#cg)'/>" +
      "<path d='M60,52 L56,66 L64,78 L58,90'" +
        " fill='none' stroke='#ff4a00' stroke-width='2' stroke-linecap='round' opacity='0.60' filter='url(#cgs)'/>" +
      "<path d='M98,33 L102,46 L93,54'" +
        " fill='none' stroke='#ff8a2b' stroke-width='1.5' stroke-linecap='round' opacity='0.48' filter='url(#cgs)'/>" +
      "<path d='M16,106 L30,98 L40,108 L56,96 L70,106 L84,92 L96,102 L112,88 L126,98 L144,93'" +
        " fill='none' stroke='url(#vc2)' stroke-width='2.2' stroke-linecap='round' filter='url(#cg)'/>" +
      "<path d='M70,106 L74,94 L82,88'" +
        " fill='none' stroke='#ff4a00' stroke-width='1.3' stroke-linecap='round' opacity='0.42' filter='url(#cgs)'/>" +
      "<path d='M28,18 L42,12 L48,20'" +
        " fill='none' stroke='url(#vc3)' stroke-width='1' stroke-linecap='round' opacity='0.55'/>" +
      "<path d='M90,130 L104,124 L112,132 L124,127'" +
        " fill='none' stroke='url(#vc3)' stroke-width='1.1' stroke-linecap='round' opacity='0.50'/>" +
      "<path d='M136,68 L148,62'" +
        " fill='none' stroke='#ff4a00' stroke-width='0.9' stroke-linecap='round' opacity='0.38'/>" +
      "<path d='M12,74 L22,68'" +
        " fill='none' stroke='#ff4a00' stroke-width='0.8' stroke-linecap='round' opacity='0.32'/>" +
    "</svg>"
  ),
  detail: [
    'radial-gradient(ellipse 52% 26% at 14% 80%, rgba(255,138,43,0.40) 0%, rgba(255,74,0,0.28) 42%, rgba(107,20,0,0.16) 74%, transparent 100%)',
    'radial-gradient(ellipse 38% 20% at 84% 40%, rgba(255,110,25,0.34) 0%, rgba(255,74,0,0.22) 48%, rgba(107,20,0,0.12) 78%, transparent 100%)',
    'radial-gradient(ellipse 24% 12% at 42% 15%, rgba(240,90,15,0.26) 0%, rgba(180,40,0,0.16) 58%, transparent 100%)',
  ].join(','),
  haze: [
    'radial-gradient(ellipse 85% 65% at 12% 22%, rgba(160,30,4,0.18) 0%, transparent 100%)',
    'radial-gradient(ellipse 72% 58% at 90% 76%, rgba(140,25,3,0.15) 0%, transparent 100%)',
    'radial-gradient(ellipse 100% 82% at 50% 50%, rgba(100,15,0,0.08) 0%, transparent 100%)',
  ].join(','),
  vignette:
    'radial-gradient(ellipse at center, transparent 28%, rgba(8,1,0,0.86) 100%)',
};