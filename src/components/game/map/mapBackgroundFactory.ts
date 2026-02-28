import type { ChapterTheme } from '../../../config/map/mapNode';

/**
 * 地图背景分五个独立渲染层，从下到上叠加：
 *
 *  base    — 单层 linear-gradient，确定主题色调基底（不透明，作为容器 background）
 *  pattern — SVG data URI 可重复瓦片，提供砖缝/裂纹/根系等"材质感"细节
 *            （screen 混合，opacity ≈ 0.85）
 *  detail  — 大块渐变分区：模拟局部光源、苔藓分布、熔岩热区等大色块变化
 *            （screen 混合，opacity ≈ 0.88）
 *  haze    — 全局色雾晕染：确立主题氛围光，面积大、alpha 低
 *            （screen 混合，opacity ≈ 0.70）
 *  vignette— 边缘压暗：主题色调加权，非通用纯黑，加强纵深感
 *            （multiply 混合，opacity 1.0）
 *
 * ⚠️ 设计原则
 *  - base 只使用单个 linear-gradient：多背景层时第一项置顶且不透明，会遮挡后续层。
 *  - screen 混合下，rgba alpha < 0.20 在近黑底色上基本不可见，pattern 中起码 0.25+。
 *  - 所有 SVG 字符串使用单引号，避免与 encodeURIComponent 产生冲突。
 */
export interface MapBackgroundLayers {
  base: string;
  pattern: string;
  detail: string;
  haze: string;
  vignette: string;
}

/**
 * 将 SVG 字符串转换为 CSS background-image 可用的 data URI。
 * 使用 encodeURIComponent 保证跨浏览器兼容。
 */
const svgUrl = (svg: string): string =>
  `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}")`;


// ─── 林地 ─────────────────────────────────────────────────────────────────────
const forestLayers: MapBackgroundLayers = {
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

// ─── 地牢 ─────────────────────────────────────────────────────────────────────
const dungeonLayers: MapBackgroundLayers = {
  // 冷蓝灰底色：暗石板颜色
  base: 'linear-gradient(180deg, #0c0e15 0%, #0a0c12 52%, #08090e 100%)',

  // SVG 瓦片：交错砖缝图案 (64×48)
  // 第一行两个砖块，第二行偏移半砖，形成标准错缝砌砖
  pattern: svgUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='48'>" +
      // 水平砖缝（行分隔线）
      "<line x1='0' y1='24' x2='64' y2='24' stroke='rgba(0,0,0,0.70)' stroke-width='2'/>" +
      // 第一行竖缝（x=32）
      "<line x1='32' y1='0'  x2='32' y2='24' stroke='rgba(0,0,0,0.70)' stroke-width='2'/>" +
      // 第二行竖缝（偏移 16，形成错缝）
      "<line x1='0'  y1='24' x2='0'  y2='48' stroke='rgba(0,0,0,0.70)' stroke-width='2'/>" +
      "<line x1='16' y1='24' x2='16' y2='48' stroke='rgba(0,0,0,0.70)' stroke-width='2'/>" +
      "<line x1='48' y1='24' x2='48' y2='48' stroke='rgba(0,0,0,0.70)' stroke-width='2'/>" +
      // 砖块上边缘高光（模拟顶光漫反射）
      "<line x1='2'  y1='2'  x2='30' y2='2'  stroke='rgba(152,162,182,0.28)' stroke-width='1'/>" +
      "<line x1='34' y1='2'  x2='62' y2='2'  stroke='rgba(152,162,182,0.22)' stroke-width='1'/>" +
      "<line x1='2'  y1='26' x2='14' y2='26' stroke='rgba(152,162,182,0.24)' stroke-width='1'/>" +
      "<line x1='18' y1='26' x2='46' y2='26' stroke='rgba(152,162,182,0.26)' stroke-width='1'/>" +
      "<line x1='50' y1='26' x2='62' y2='26' stroke='rgba(152,162,182,0.20)' stroke-width='1'/>" +
      // 砖面漫反射填充（极低 alpha，仅体现质感差异）
      "<rect x='2'  y='2'  width='28' height='20' fill='rgba(140,150,170,0.07)'/>" +
      "<rect x='34' y='2'  width='28' height='20' fill='rgba(130,140,160,0.05)'/>" +
      "<rect x='18' y='26' width='28' height='20' fill='rgba(145,155,175,0.08)'/>" +
    "</svg>"
  ),

  // 中心火把/灯笼暖光 + 角落渗水印迹
  detail: [
    'radial-gradient(ellipse 38% 26% at 28% 52%, rgba(88, 78, 58, 0.30) 0%, transparent 100%)',
    'radial-gradient(ellipse 30% 22% at 72% 48%, rgba(80, 72, 55, 0.25) 0%, transparent 100%)',
    'radial-gradient(ellipse 25% 18% at 50% 20%, rgba(130, 145, 175, 0.22) 0%, transparent 100%)',
  ].join(','),

  // 顶部幽冷光渗入 + 底部腐锈沉积
  haze: [
    'radial-gradient(ellipse 72% 44% at 50% 0%,   rgba(132, 148, 185, 0.22) 0%, transparent 100%)',
    'radial-gradient(ellipse 48% 38% at 12% 88%,  rgba(112,  85,  60, 0.18) 0%, transparent 100%)',
  ].join(','),

  // 边缘压暗：深蓝灰晕影，模拟石窟纵深
  vignette:
    'radial-gradient(ellipse at center, transparent 40%, rgba(4, 5, 14, 0.58) 100%)',
};

// ─── 火山 ─────────────────────────────────────────────────────────────────────
// 设计关键词：压迫 · 焦黑 · 脉动 · 爆裂前兆 · 邪火感
// 色板：背景暗 #140403 | 岩石 #2a0a05 | 裂缝暗 #6b1400 | 裂缝亮 #ff4a00 | 熔岩核心 #ff8a2b
const volcanoLayers: MapBackgroundLayers = {
  // 第一层：焦黑火山岩基底 — 被烧焦但还在闷燃的岩壳
  // 主色 #1b0603 ~ #2a0a05，带细碎颗粒感，局部暗红渗透
  base:
    'linear-gradient(188deg, #1b0603 0%, #180503 20%, #150403 45%, #110302 72%, #0c0201 88%, #080101 100%)',

  // 第二层：不规则裂缝熔岩 SVG 瓦片
  // 设计：锯齿状 + 分叉 + 不连续 + 粗细变化 + 裂缝颜色渐变
  // 颜色：中心 #ff8a2b → 过渡 #ff4a00 → 边缘 #6b1400
  pattern: svgUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>" +

      "<defs>" +
        // 主裂缝渐变（横向）
        "<linearGradient id='vc1' x1='0%' y1='0%' x2='100%' y2='0%'>" +
          "<stop offset='0%'   stop-color='#6b1400' stop-opacity='0.28'/>" +
          "<stop offset='28%'  stop-color='#ff4a00' stop-opacity='0.72'/>" +
          "<stop offset='52%'  stop-color='#ff8a2b' stop-opacity='0.92'/>" +
          "<stop offset='76%'  stop-color='#ff4a00' stop-opacity='0.65'/>" +
          "<stop offset='100%' stop-color='#6b1400' stop-opacity='0.20'/>" +
        "</linearGradient>" +
        // 次裂缝渐变（斜向）
        "<linearGradient id='vc2' x1='0%' y1='0%' x2='100%' y2='100%'>" +
          "<stop offset='0%'   stop-color='#6b1400' stop-opacity='0.22'/>" +
          "<stop offset='45%'  stop-color='#ff4a00' stop-opacity='0.58'/>" +
          "<stop offset='100%' stop-color='#6b1400' stop-opacity='0.18'/>" +
        "</linearGradient>" +
        // 细裂缝渐变
        "<linearGradient id='vc3' x1='0%' y1='0%' x2='100%' y2='0%'>" +
          "<stop offset='0%'   stop-color='#6b1400' stop-opacity='0.15'/>" +
          "<stop offset='50%'  stop-color='#ff4a00' stop-opacity='0.45'/>" +
          "<stop offset='100%' stop-color='#6b1400' stop-opacity='0.12'/>" +
        "</linearGradient>" +
        // 裂缝发光滤镜
        "<filter id='cg' x='-30%' y='-30%' width='160%' height='160%'>" +
          "<feGaussianBlur stdDeviation='2.2' result='blur'/>" +
          "<feMerge>" +
            "<feMergeNode in='blur'/>" +
            "<feMergeNode in='SourceGraphic'/>" +
          "</feMerge>" +
        "</filter>" +
        // 细裂缝较弱发光
        "<filter id='cgs' x='-20%' y='-20%' width='140%' height='140%'>" +
          "<feGaussianBlur stdDeviation='1.2' result='blur'/>" +
          "<feMerge>" +
            "<feMergeNode in='blur'/>" +
            "<feMergeNode in='SourceGraphic'/>" +
          "</feMerge>" +
        "</filter>" +
      "</defs>" +

      // ── 焦岩基底（黑色焦岩主导）───────────────────────────────────
      "<rect width='160' height='160' fill='#150403'/>" +

      // ── 焦岩颗粒质感（暗红微渗，细碎噪点）──────────────────────────
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
      // 局部暗红渗透斑块
      "<ellipse cx='62'  cy='45'  rx='8'  ry='3'   fill='rgba(107,20,0,0.22)'/>" +
      "<ellipse cx='112' cy='98'  rx='6'  ry='2.5' fill='rgba(95,18,0,0.18)'/>" +
      "<ellipse cx='30'  cy='118' rx='5'  ry='2'   fill='rgba(85,16,0,0.16)'/>" +

      // ── 主裂缝（锯齿状，完全在瓦片内 x:12~150，消除接缝断差）──────────
      "<path d='M12,54 L26,45 L34,56 L48,42 L60,52 L72,38 L84,48 L98,33 L112,44 L124,30 L138,40 L150,35'" +
        " fill='none' stroke='url(#vc1)' stroke-width='3.5' stroke-linecap='round' filter='url(#cg)'/>" +

      // 主裂缝分叉 A（向下分叉，不对称）
      "<path d='M60,52 L56,66 L64,78 L58,90'" +
        " fill='none' stroke='#ff4a00' stroke-width='2' stroke-linecap='round' opacity='0.60' filter='url(#cgs)'/>" +

      // 主裂缝分叉 B（细小，向上）
      "<path d='M98,33 L102,46 L93,54'" +
        " fill='none' stroke='#ff8a2b' stroke-width='1.5' stroke-linecap='round' opacity='0.48' filter='url(#cgs)'/>" +

      // ── 次级裂缝（较细，完全在瓦片内 x:16~144）─────────────────────────
      "<path d='M16,106 L30,98 L40,108 L56,96 L70,106 L84,92 L96,102 L112,88 L126,98 L144,93'" +
        " fill='none' stroke='url(#vc2)' stroke-width='2.2' stroke-linecap='round' filter='url(#cg)'/>" +

      // 次级分叉（方向相反，增加混乱感）
      "<path d='M70,106 L74,94 L82,88'" +
        " fill='none' stroke='#ff4a00' stroke-width='1.3' stroke-linecap='round' opacity='0.42' filter='url(#cgs)'/>" +

      // ── 毛细裂缝（断续，细线，不连续）──────────────────────────────
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

  // 第三层：局部熔岩池（椭圆，大块，中央高亮，不对称）
  // 注意：脉动动画由 MapViewport 内 DOM 元素承担，这里是静态热区
  detail: [
    // 左下角主熔岩池（最大，主要热源）
    'radial-gradient(ellipse 52% 26% at 14% 80%, rgba(255,138,43,0.40) 0%, rgba(255,74,0,0.28) 42%, rgba(107,20,0,0.16) 74%, transparent 100%)',
    // 右侧中部熔岩池
    'radial-gradient(ellipse 38% 20% at 84% 40%, rgba(255,110,25,0.34) 0%, rgba(255,74,0,0.22) 48%, rgba(107,20,0,0.12) 78%, transparent 100%)',
    // 中上偏左小热区
    'radial-gradient(ellipse 24% 12% at 42% 15%, rgba(240,90,15,0.26) 0%, rgba(180,40,0,0.16) 58%, transparent 100%)',
  ].join(','),

  // 热雾层：压抑暗红系色雾（焦黑基调，低亮度）
  haze: [
    'radial-gradient(ellipse 85% 65% at 12% 22%, rgba(160,30,4,0.18) 0%, transparent 100%)',
    'radial-gradient(ellipse 72% 58% at 90% 76%, rgba(140,25,3,0.15) 0%, transparent 100%)',
    'radial-gradient(ellipse 100% 82% at 50% 50%, rgba(100,15,0,0.08) 0%, transparent 100%)',
  ].join(','),

  // 边缘强压暗 — 深层火山裂界，封闭压迫感
  vignette:
    'radial-gradient(ellipse at center, transparent 28%, rgba(8,1,0,0.86) 100%)',
};

// ─── 亡灵 ─────────────────────────────────────────────────────────────────────
const undeadLayers: MapBackgroundLayers = {
  // 深紫黑底色，接近腐败沙漠夜晚
  base: 'linear-gradient(170deg, #0c0a14 0%, #09080f 52%, #07060b 100%)',

  // SVG 瓦片：冻土/骨质裂纹网 (70×70)
  // 六边形结构框架 + 内部次级裂纹 + 冷光亮点
  pattern: svgUrl(
    "<svg xmlns='http://www.w3.org/2000/svg' width='70' height='70'>" +
      // 外层裂纹多边形（暗紫骨质）
      "<path d='M35,2 L60,14 L66,42 L50,66 L20,66 L4,42 L10,14 Z'" +
        " fill='none' stroke='rgba(138,112,180,0.40)' stroke-width='1.5'/>" +
      // 内层次级裂纹（更细）
      "<path d='M35,16 L50,32 L42,56 L28,56 L20,32 Z'" +
        " fill='none' stroke='rgba(118,95,158,0.32)' stroke-width='1'/>" +
      // 从顶点延伸的毛细裂纹
      "<line x1='35' y1='2'  x2='35' y2='16' stroke='rgba(158,132,198,0.40)' stroke-width='0.8'/>" +
      "<line x1='60' y1='14' x2='50' y2='32' stroke='rgba(148,122,188,0.36)' stroke-width='0.8'/>" +
      "<line x1='66' y1='42' x2='50' y2='32' stroke='rgba(148,122,188,0.34)' stroke-width='0.8'/>" +
      "<line x1='50' y1='66' x2='42' y2='56' stroke='rgba(138,112,178,0.30)' stroke-width='0.8'/>" +
      "<line x1='4'  y1='42' x2='20' y2='32' stroke='rgba(138,112,178,0.32)' stroke-width='0.8'/>" +
      // 鬼火/冰晶高光点
      "<circle cx='10' cy='10' r='4.5' fill='rgba(168,210,232,0.16)'/>" +
      "<circle cx='60' cy='62' r='4'   fill='rgba(148,185,220,0.14)'/>" +
      "<circle cx='35' cy='35' r='3'   fill='rgba(162,142,210,0.12)'/>" +
      "<circle cx='62' cy='14' r='2'   fill='rgba(170,215,235,0.12)'/>" +
    "</svg>"
  ),

  // 两处幽灵聚集的冷辉 + 中心骸骨反光
  detail: [
    'radial-gradient(ellipse 42% 30% at 22% 30%, rgba(155, 195, 220, 0.28) 0%, transparent 100%)',
    'radial-gradient(ellipse 36% 26% at 78% 68%, rgba(138, 108, 185, 0.26) 0%, transparent 100%)',
    'radial-gradient(ellipse 28% 22% at 50% 50%, rgba(145, 125, 190, 0.20) 0%, transparent 100%)',
  ].join(','),

  // 大范围冷蓝紫环境光
  haze: [
    'radial-gradient(ellipse 62% 48% at 15% 18%, rgba(155, 198, 222, 0.22) 0%, transparent 100%)',
    'radial-gradient(ellipse 52% 42% at 85% 78%, rgba(138, 108, 188, 0.20) 0%, transparent 100%)',
  ].join(','),

  // 边缘压暗：深紫晕影，强化死域封闭窒息感
  vignette:
    'radial-gradient(ellipse at center, transparent 40%, rgba(5, 3, 12, 0.58) 100%)',
};

// ─── 兜底 ─────────────────────────────────────────────────────────────────────
const fallbackLayers: MapBackgroundLayers = {
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

export const getMapBackgroundLayers = (theme: ChapterTheme): MapBackgroundLayers => {
  if (theme === '林地') return forestLayers;
  if (theme === '地牢') return dungeonLayers;
  if (theme === '火山') return volcanoLayers;
  if (theme === '亡灵') return undeadLayers;
  return fallbackLayers;
};
