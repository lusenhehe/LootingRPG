export type MapEncounterType = 'normal' | 'elite' | 'boss' | 'wave';

export interface MapNodeDef {
  id: string;
  name: string;
  recommendedLevel: number;
  encounterType: MapEncounterType;
  firstClearRewardGold: number;
  position: {
    x: number;
    y: number;
  };
  waveSize?: number;
}

export interface MapChapterDef {
  id: string;
  name: string;
  levelRange: string;
  theme: string;
  nodes: MapNodeDef[];
}

export const MAP_CHAPTERS: MapChapterDef[] = [
  {
    id: 'chapter-1',
    name: '新手林地',
    levelRange: 'Lv.1-10',
    theme: '林地',
    nodes: [
      { id: '1-1', name: '侦查营地', recommendedLevel: 2, encounterType: 'normal', firstClearRewardGold: 120, position: { x: 20, y: 45 } },
      { id: '1-2', name: '苔石峡谷', recommendedLevel: 4, encounterType: 'elite', firstClearRewardGold: 160, position: { x: 50, y: 45 } },
      { id: '1-3', name: '林地小径', recommendedLevel: 6, encounterType: 'normal', firstClearRewardGold: 180, position: { x: 80, y: 45 } },
      { id: '1-4', name: '荒树基地', recommendedLevel: 8, encounterType: 'elite', firstClearRewardGold: 200, position: { x: 20, y: 50 } },
      { id: '1-5', name: '古井之石', recommendedLevel: 9, encounterType: 'wave', waveSize: 4, firstClearRewardGold: 220, position: { x: 50, y: 50 } },
      { id: '1-6', name: '倒塌断桥', recommendedLevel: 10, encounterType: 'normal', firstClearRewardGold: 240, position: { x: 80, y: 50 } },
      { id: '1-7', name: '密林祭坛', recommendedLevel: 11, encounterType: 'elite', firstClearRewardGold: 260, position: { x: 20, y: 55 } },
      { id: '1-8', name: '蛮兽洞穴', recommendedLevel: 12, encounterType: 'normal', firstClearRewardGold: 280, position: { x: 50, y: 55 } },
      { id: '1-9', name: '风暴草场', recommendedLevel: 13, encounterType: 'elite', firstClearRewardGold: 300, position: { x: 80, y: 55 } },
      { id: '1-10', name: '林地首领巢穴', recommendedLevel: 14, encounterType: 'boss', firstClearRewardGold: 400, position: { x: 50, y: 60 } },
    ],
  },
  {
    id: 'chapter-2',
    name: '废弃地牢',
    levelRange: 'Lv.10-20',
    theme: '地牢',
    nodes: [
      { id: '2-1', name: '破碎回廊', recommendedLevel: 12, encounterType: 'normal', firstClearRewardGold: 160, position: { x: 20, y: 45 } },
      { id: '2-2', name: '幽影牢室', recommendedLevel: 14, encounterType: 'elite', firstClearRewardGold: 200, position: { x: 50, y: 45 } },
      { id: '2-3', name: '隐匿小窟', recommendedLevel: 16, encounterType: 'normal', firstClearRewardGold: 220, position: { x: 80, y: 45 } },
      { id: '2-4', name: '漆黑仓库', recommendedLevel: 18, encounterType: 'elite', firstClearRewardGold: 240, position: { x: 20, y: 50 } },
      { id: '2-5', name: '毒气囚室', recommendedLevel: 19, encounterType: 'wave', waveSize: 5, firstClearRewardGold: 260, position: { x: 50, y: 50 } },
      { id: '2-6', name: '断裂枢纽', recommendedLevel: 20, encounterType: 'normal', firstClearRewardGold: 280, position: { x: 80, y: 50 } },
      { id: '2-7', name: '铁链牢门', recommendedLevel: 22, encounterType: 'elite', firstClearRewardGold: 300, position: { x: 20, y: 55 } },
      { id: '2-8', name: '监狱深渊', recommendedLevel: 24, encounterType: 'normal', firstClearRewardGold: 320, position: { x: 50, y: 55 } },
      { id: '2-9', name: '亡灵囚笼', recommendedLevel: 26, encounterType: 'elite', firstClearRewardGold: 340, position: { x: 80, y: 55 } },
      { id: '2-10', name: '地牢领主王座', recommendedLevel: 28, encounterType: 'boss', firstClearRewardGold: 400, position: { x: 50, y: 60 } },
    ],
  },
  {
    id: 'chapter-3',
    name: '熔岩深渊',
    levelRange: 'Lv.20-35',
    theme: '火山',
    nodes: [
      { id: '3-1', name: '熔火', recommendedLevel: 23, encounterType: 'normal', firstClearRewardGold: 220, position: { x: 20, y: 45 } },
      { id: '3-2', name: '灰烬祭坛', recommendedLevel: 25, encounterType: 'elite', firstClearRewardGold: 260, position: { x: 50, y: 45 } },
      { id: '3-3', name: '炽热小径', recommendedLevel: 27, encounterType: 'normal', firstClearRewardGold: 280, position: { x: 80, y: 45 } },
      { id: '3-4', name: '熔岩漩涡', recommendedLevel: 29, encounterType: 'elite', firstClearRewardGold: 300, position: { x: 20, y: 50 } },
      { id: '3-5', name: '熔岩洞穴', recommendedLevel: 30, encounterType: 'wave', waveSize: 5, firstClearRewardGold: 320, position: { x: 50, y: 50 } },
      { id: '3-6', name: '炽焰断层', recommendedLevel: 32, encounterType: 'normal', firstClearRewardGold: 340, position: { x: 80, y: 50 } },
      { id: '3-7', name: '熔岩祭坛', recommendedLevel: 33, encounterType: 'elite', firstClearRewardGold: 360, position: { x: 20, y: 55 } },
      { id: '3-8', name: '焦土平原', recommendedLevel: 34, encounterType: 'normal', firstClearRewardGold: 380, position: { x: 50, y: 55 } },
      { id: '3-9', name: '烈焰岗哨', recommendedLevel: 35, encounterType: 'elite', firstClearRewardGold: 400, position: { x: 80, y: 55 } },
      { id: '3-10', name: '深渊核心', recommendedLevel: 36, encounterType: 'boss', firstClearRewardGold: 520, position: { x: 50, y: 60 } },
    ],
  },
  {
    id: 'chapter-4',
    name: '永夜墓园',
    levelRange: 'Lv.35-50',
    theme: '亡灵',
    nodes: [
      { id: '4-1', name: '枯骨庭院', recommendedLevel: 38, encounterType: 'normal', firstClearRewardGold: 260, position: { x: 20, y: 45 } },
      { id: '4-2', name: '死灵拱廊', recommendedLevel: 40, encounterType: 'elite', firstClearRewardGold: 300, position: { x: 50, y: 45 } },
      { id: '4-3', name: '幽魂小径', recommendedLevel: 42, encounterType: 'normal', firstClearRewardGold: 320, position: { x: 80, y: 45 } },
      { id: '4-4', name: '暗影墓穴', recommendedLevel: 44, encounterType: 'elite', firstClearRewardGold: 340, position: { x: 20, y: 50 } },
      { id: '4-5', name: '灵魂', recommendedLevel: 45, encounterType: 'wave', waveSize: 5, firstClearRewardGold: 360, position: { x: 50, y: 50 } },
      { id: '4-6', name: '腐蚀祭坛', recommendedLevel: 47, encounterType: 'normal', firstClearRewardGold: 380, position: { x: 80, y: 50 } },
      { id: '4-7', name: '亡者长', recommendedLevel: 48, encounterType: 'elite', firstClearRewardGold: 400, position: { x: 20, y: 55 } },
      { id: '4-8', name: '暗影广场', recommendedLevel: 49, encounterType: 'normal', firstClearRewardGold: 420, position: { x: 50, y: 55 } },
      { id: '4-9', name: '亡灵祭坛', recommendedLevel: 50, encounterType: 'elite', firstClearRewardGold: 440, position: { x: 80, y: 55 } },
      { id: '4-10', name: '冥灯守望', recommendedLevel: 52, encounterType: 'boss', firstClearRewardGold: 560, position: { x: 50, y: 60 } },
    ],
  },
  {
    id: 'chapter-5',
    name: '风暴海岸',
    levelRange: 'Lv.50-65',
    theme: '风暴',
    nodes: [
      { id: '5-1', name: '断潮码头', recommendedLevel: 53, encounterType: 'normal', firstClearRewardGold: 320, position: { x: 20, y: 45 } },
      { id: '5-2', name: '雷涌灯塔', recommendedLevel: 55, encounterType: 'elite', firstClearRewardGold: 360, position: { x: 50, y: 45 } },
      { id: '5-3', name: '潮汐礁石', recommendedLevel: 57, encounterType: 'normal', firstClearRewardGold: 380, position: { x: 80, y: 45 } },
      { id: '5-4', name: '风暴栈桥', recommendedLevel: 59, encounterType: 'elite', firstClearRewardGold: 400, position: { x: 20, y: 50 } },
      { id: '5-5', name: '巨浪洞穴', recommendedLevel: 60, encounterType: 'wave', waveSize: 6, firstClearRewardGold: 420, position: { x: 50, y: 50 } },
      { id: '5-6', name: '暗潮深渊', recommendedLevel: 62, encounterType: 'normal', firstClearRewardGold: 440, position: { x: 80, y: 50 } },
      { id: '5-7', name: '雷霆礁群', recommendedLevel: 63, encounterType: 'elite', firstClearRewardGold: 460, position: { x: 20, y: 55 } },
      { id: '5-8', name: '潮汐祭坛', recommendedLevel: 64, encounterType: 'normal', firstClearRewardGold: 480, position: { x: 50, y: 55 } },
      { id: '5-9', name: '海啸之眼', recommendedLevel: 65, encounterType: 'elite', firstClearRewardGold: 500, position: { x: 80, y: 55 } },
      { id: '5-10', name: '海啸先知', recommendedLevel: 67, encounterType: 'boss', firstClearRewardGold: 620, position: { x: 50, y: 60 } },
    ],
  },
  {
    id: 'chapter-6',
    name: '机械荒城',
    levelRange: 'Lv.65-80',
    theme: '机械',
    nodes: [
      { id: '6-1', name: '锈蚀车站', recommendedLevel: 68, encounterType: 'normal', firstClearRewardGold: 360, position: { x: 20, y: 45 } },
      { id: '6-2', name: '齿轮工坊', recommendedLevel: 70, encounterType: 'elite', firstClearRewardGold: 400, position: { x: 50, y: 45 } },
      { id: '6-3', name: '传输通道', recommendedLevel: 72, encounterType: 'normal', firstClearRewardGold: 420, position: { x: 80, y: 45 } },
      { id: '6-4', name: '机械地窖', recommendedLevel: 74, encounterType: 'elite', firstClearRewardGold: 440, position: { x: 20, y: 50 } },
      { id: '6-5', name: '齿轮迷宫', recommendedLevel: 75, encounterType: 'wave', waveSize: 7, firstClearRewardGold: 460, position: { x: 50, y: 50 } },
      { id: '6-6', name: '锈蚀车间', recommendedLevel: 77, encounterType: 'normal', firstClearRewardGold: 480, position: { x: 80, y: 50 } },
      { id: '6-7', name: '动力核心', recommendedLevel: 78, encounterType: 'elite', firstClearRewardGold: 500, position: { x: 20, y: 55 } },
      { id: '6-8', name: '齿轮塔楼', recommendedLevel: 79, encounterType: 'normal', firstClearRewardGold: 520, position: { x: 50, y: 55 } },
      { id: '6-9', name: '废弃工坊', recommendedLevel: 80, encounterType: 'elite', firstClearRewardGold: 540, position: { x: 80, y: 55 } },
      { id: '6-10', name: '主控核心', recommendedLevel: 82, encounterType: 'boss', firstClearRewardGold: 760, position: { x: 50, y: 60 } },
    ],
  },
  {
    id: 'chapter-7',
    name: '晶簇高原',
    levelRange: 'Lv.80-100',
    theme: '晶体',
    nodes: [
      { id: '7-1', name: '蓝晶台地', recommendedLevel: 84, encounterType: 'normal', firstClearRewardGold: 440, position: { x: 20, y: 45 } },
      { id: '7-2', name: '折光裂谷', recommendedLevel: 86, encounterType: 'elite', firstClearRewardGold: 480, position: { x: 50, y: 45 } },
      { id: '7-3', name: '晶石小径', recommendedLevel: 88, encounterType: 'normal', firstClearRewardGold: 500, position: { x: 80, y: 45 } },
      { id: '7-4', name: '镜面水潭', recommendedLevel: 90, encounterType: 'elite', firstClearRewardGold: 520, position: { x: 20, y: 50 } },
      { id: '7-5', name: '碎晶洞穴', recommendedLevel: 92, encounterType: 'wave', waveSize: 6, firstClearRewardGold: 540, position: { x: 50, y: 50 } },
      { id: '7-6', name: '晶核祭坛', recommendedLevel: 94, encounterType: 'normal', firstClearRewardGold: 560, position: { x: 80, y: 50 } },
      { id: '7-7', name: '光影', recommendedLevel: 96, encounterType: 'elite', firstClearRewardGold: 580, position: { x: 20, y: 55 } },
      { id: '7-8', name: '虹彩广场', recommendedLevel: 98, encounterType: 'normal', firstClearRewardGold: 600, position: { x: 50, y: 55 } },
      { id: '7-9', name: '晶簇之脉', recommendedLevel: 100, encounterType: 'elite', firstClearRewardGold: 620, position: { x: 80, y: 55 } },
      { id: '7-10', name: '棱镜裁决', recommendedLevel: 102, encounterType: 'boss', firstClearRewardGold: 860, position: { x: 50, y: 60 } },
    ],
  },
  {
    id: 'chapter-8',
    name: '虚空边境',
    levelRange: 'Lv.100-120',
    theme: '虚空',
    nodes: [
      { id: '8-1', name: '失序前哨', recommendedLevel: 104, encounterType: 'normal', firstClearRewardGold: 520, position: { x: 20, y: 45 } },
      { id: '8-2', name: '裂隙回环', recommendedLevel: 106, encounterType: 'elite', firstClearRewardGold: 560, position: { x: 50, y: 45 } },
      { id: '8-3', name: '幽影裂缝', recommendedLevel: 108, encounterType: 'normal', firstClearRewardGold: 580, position: { x: 80, y: 45 } },
      { id: '8-4', name: '漂浮残骸', recommendedLevel: 110, encounterType: 'elite', firstClearRewardGold: 600, position: { x: 20, y: 50 } },
      { id: '8-5', name: '虚空试炼', recommendedLevel: 112, encounterType: 'wave', waveSize: 8, firstClearRewardGold: 620, position: { x: 50, y: 50 } },
      { id: '8-6', name: '失重平台', recommendedLevel: 114, encounterType: 'normal', firstClearRewardGold: 640, position: { x: 80, y: 50 } },
      { id: '8-7', name: '反射镜域', recommendedLevel: 116, encounterType: 'elite', firstClearRewardGold: 660, position: { x: 20, y: 55 } },
      { id: '8-8', name: '暗潮节点', recommendedLevel: 118, encounterType: 'normal', firstClearRewardGold: 680, position: { x: 50, y: 55 } },
      { id: '8-9', name: '漂浮远点', recommendedLevel: 120, encounterType: 'elite', firstClearRewardGold: 700, position: { x: 80, y: 55 } },
      { id: '8-10', name: '虚无织', recommendedLevel: 122, encounterType: 'boss', firstClearRewardGold: 980, position: { x: 50, y: 60 } },
    ],
  },
  {
    id: 'chapter-9',
    name: '星渊回廊',
    levelRange: 'Lv.120-145',
    theme: '星空',
    nodes: [
      { id: '9-1', name: '陨星阶梯', recommendedLevel: 125, encounterType: 'normal', firstClearRewardGold: 640, position: { x: 20, y: 45 } },
      { id: '9-2', name: '深空祭坛', recommendedLevel: 127, encounterType: 'elite', firstClearRewardGold: 680, position: { x: 50, y: 45 } },
      { id: '9-3', name: '星辰小径', recommendedLevel: 129, encounterType: 'normal', firstClearRewardGold: 700, position: { x: 80, y: 45 } },
      { id: '9-4', name: '宇宙玄域', recommendedLevel: 131, encounterType: 'elite', firstClearRewardGold: 720, position: { x: 20, y: 50 } },
      { id: '9-5', name: '流星雨场', recommendedLevel: 133, encounterType: 'wave', waveSize: 9, firstClearRewardGold: 740, position: { x: 50, y: 50 } },
      { id: '9-6', name: '星云洞穴', recommendedLevel: 135, encounterType: 'normal', firstClearRewardGold: 760, position: { x: 80, y: 50 } },
      { id: '9-7', name: '时空裂隙', recommendedLevel: 137, encounterType: 'elite', firstClearRewardGold: 780, position: { x: 20, y: 55 } },
      { id: '9-8', name: '虚空阶梯', recommendedLevel: 139, encounterType: 'normal', firstClearRewardGold: 800, position: { x: 50, y: 55 } },
      { id: '9-9', name: '星渊祭坛', recommendedLevel: 141, encounterType: 'elite', firstClearRewardGold: 820, position: { x: 80, y: 55 } },
      { id: '9-10', name: '天穹吞噬', recommendedLevel: 143, encounterType: 'boss', firstClearRewardGold: 1180, position: { x: 50, y: 60 } },
    ],
  },
  {
    id: 'chapter-10',
    name: '终焉王座',
    levelRange: 'Lv.145-170',
    theme: '终焉',
    nodes: [
      { id: '10-1', name: '终焉前庭', recommendedLevel: 150, encounterType: 'normal', firstClearRewardGold: 780, position: { x: 20, y: 45 } },
      { id: '10-2', name: '王座禁区', recommendedLevel: 152, encounterType: 'elite', firstClearRewardGold: 820, position: { x: 50, y: 45 } },
      { id: '10-3', name: '荒废祭坛', recommendedLevel: 154, encounterType: 'normal', firstClearRewardGold: 840, position: { x: 80, y: 45 } },
      { id: '10-4', name: '末日守卫', recommendedLevel: 156, encounterType: 'elite', firstClearRewardGold: 860, position: { x: 20, y: 50 } },
      { id: '10-5', name: '虚无深渊', recommendedLevel: 158, encounterType: 'wave', waveSize: 10, firstClearRewardGold: 880, position: { x: 50, y: 50 } },
      { id: '10-6', name: '恐惧大厅', recommendedLevel: 160, encounterType: 'normal', firstClearRewardGold: 900, position: { x: 80, y: 50 } },
      { id: '10-7', name: '终焉祭坛', recommendedLevel: 162, encounterType: 'elite', firstClearRewardGold: 920, position: { x: 20, y: 55 } },
      { id: '10-8', name: '末日广场', recommendedLevel: 164, encounterType: 'normal', firstClearRewardGold: 940, position: { x: 50, y: 55 } },
      { id: '10-9', name: '深渊之门', recommendedLevel: 166, encounterType: 'elite', firstClearRewardGold: 960, position: { x: 80, y: 55 } },
      { id: '10-10', name: '终焉之主', recommendedLevel: 170, encounterType: 'boss', firstClearRewardGold: 1400, position: { x: 50, y: 60 } },
    ],
  },
];
