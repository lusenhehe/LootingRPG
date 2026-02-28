import { MapBackgroundLayers } from '../mapBackgroundLayers';
import { svgUrl } from '../mapBackgroundUtils';

export const forestLayers: MapBackgroundLayers = {
  // 暗绿底色：顶部偏青，底部趋向深黑棕，模拟苔藓覆盖的腐泥地面
  base: 'linear-gradient(170deg, #0e1a0f 0%, #0b130a 50%, #080d07 100%)',

  // SVG 瓦片：根系网络 + 地面碎石
  // 80×80 单元：两条贝塞尔根脉（横/纵各一），四粒随机碎石
  pattern: svgUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>" +
      // 横向主根脉，S 形曲线
      "<path d='M0,40 Q20,30 40,40 Q60,50 80,40' fill='none' stroke='rgba(65,105,45,0.40)' stroke-width='1.6'/>" +
      // 纵向次根脉
      "<path d='M40,0 Q30,20 40,40 Q50,60 40,80' fill='none' stroke='rgba(55,88,38,0.35)' stroke-width='1.4'/>" +
      // 边缘辅助细根（让瓦片拼接时有连贯感）
      "<path d='M0,20 Q10,28 20,22' fill='none' stroke='rgba(70,55,30,0.28)' stroke-width='1'/>" +
      "<path d='M60,58 Q70,52 80,60' fill='none' stroke='rgba(70,55,30,0.25)' stroke-width='1'/>" +
      // 苔藓/碎石圆点
      "<circle cx='22' cy='22' r='2.5' fill='rgba(90,70,40,0.28)'/>" +
      "<circle cx='60' cy='18' r='1.8' fill='rgba(75,115,52,0.25)'/>" +
      "<circle cx='65' cy='62' r='2.2' fill='rgba(68,100,48,0.22)'/>" +
      "<circle cx='16' cy='60' r='1.5' fill='rgba(95,75,42,0.26)'/>" +
      "<circle cx='46' cy='14' r='1.2' fill='rgba(100,80,45,0.20)'/>" +
    "</svg>"
  ),

  // 局部光照区：模拟树冠间隙漏下的光斑 + 右下角阴影
  detail: [
    'radial-gradient(ellipse 52% 36% at 22% 68%, rgba(100, 75, 32, 0.32) 0%, transparent 100%)',
    'radial-gradient(ellipse 42% 30% at 78% 28%, rgba(68, 108, 48, 0.28) 0%, transparent 100%)',
    'radial-gradient(ellipse 30% 22% at 50% 50%, rgba(55,  90, 40, 0.20) 0%, transparent 100%)',
  ].join(','),

  // 大范围树冠投影色调 + 角落苔绿晕
  haze: [
    'radial-gradient(ellipse 65% 50% at 18% 12%, rgba(48, 92, 36, 0.24) 0%, transparent 100%)',
    'radial-gradient(ellipse 55% 45% at 84% 80%, rgba(72, 118, 50, 0.20) 0%, transparent 100%)',
  ].join(','),

  // 边缘压暗：深绿色调晕影，强化林中封闭感
  vignette:
    'radial-gradient(ellipse at center, transparent 42%, rgba(3, 10, 3, 0.55) 100%)',
};
