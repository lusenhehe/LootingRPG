# LootingRPG - Dark Fantasy Game UI Design System

## Style Overview
- **Theme**: Dark Fantasy / Dungeon Crawler
- **Mood**: Gritty, immersive, mysterious, ancient
- **Primary Colors**: Deep blacks, blood reds, tarnished gold, bone white

## Color Palette

### Background Colors
| Name | Hex | Usage |
|------|-----|-------|
| Void Black | `#0A0908` | Main background |
| Deep Stone | `#1C1917` | Card backgrounds |
| Cave Wall | `#292524` | Borders, dividers |

### Accent Colors
| Name | Hex | Usage |
|------|-----|-------|
| Blood Red | `#991B1B` | Primary CTA, danger |
| Tarnished Gold | `#B45309` | Highlights, accents |
| Ember Orange | `#F59E0B` | Legendary items |
| Bone White | `#A8A29E` | Common quality |
| Ethereal Green | `#22C55E` | Uncommon quality |
| Arcane Blue | `#3B82F6` | Rare quality |
| Mythic Purple | `#7C3AED` | Mythic items |

### Text Colors
| Name | Hex | Usage |
|------|-----|-------|
| Ghost White | `#FAFAF9` | Primary text |
| Ash Gray | `#A8A29E` | Secondary text |
| Torch Glow | `#FCD34D` | Important numbers |

## Typography

### Font Families
- **Display (Headings)**: `Cinzel` - Ancient Roman feel
- **Body**: `Crimson Text` - Old book feel
- **Mono (Stats)**: `JetBrains Mono` - For numbers

### Font Sizes
- Hero Title: 2rem (32px)
- Section Title: 1.5rem (24px)
- Card Title: 1rem (16px)
- Body: 0.875rem (14px)
- Caption: 0.75rem (12px)

## Layout Patterns

### Game HUD Layout (vs Web Layout)

**Old Web Layout:**
```
┌─────────────────────────────────────┐
│  Header (fixed top)                 │
├────────┬────────────────────────────┤
│ Sidebar│  Main Content              │
│        │                            │
└────────┴────────────────────────────┘
```

**New Game HUD Layout:**
```
┌─────────────────────────────────────┐
│  HUD Top Bar (stats, gold, level)  │
├─────────────────────────────────────┤
│                                     │
│         Main Game Area              │
│      (Map / Battle / Inventory)    │
│                                     │
├─────────────────────────────────────┤
│  Action Bar / Quick Access         │
└─────────────────────────────────────┘
```

### Key Differences
1. **No sidebar** - Full-screen immersive view
2. **Floating panels** - Draggable/collapsible panels
3. **HUD overlay** - Stats overlay on corners
4. **Action bar** - Bottom quick access bar

## Component Styles

### Fantasy Card
```css
.game-card {
  background: linear-gradient(145deg, #1C1917, #0A0908);
  border: 1px solid #292524;
  border-radius: 4px;
  position: relative;
  box-shadow: 
    inset 0 1px 0 rgba(255,255,255,0.05),
    0 4px 12px rgba(0,0,0,0.5);
}

.game-card::before,
.game-card::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid #B45309;
}

.game-card::before {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
}

.game-card::after {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
}
```

### Fantasy Button
```css
.fantasy-button {
  background: linear-gradient(180deg, #292524 0%, #1C1917 100%);
  border: 1px solid #44403C;
  border-radius: 2px;
  color: #FAFAF9;
  padding: 8px 16px;
  position: relative;
  overflow: hidden;
}

.fantasy-button:hover {
  border-color: #B45309;
  box-shadow: 0 0 10px rgba(180, 83, 9, 0.3);
}

.fantasy-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
}
```

### Tab Button (Active State)
```css
.fantasy-tab {
  background: linear-gradient(180deg, rgba(153, 27, 27, 0.2) 0%, transparent 100%);
  border: 1px solid #292524;
  border-bottom: 2px solid #991B1B;
  color: #FAFAF9;
  position: relative;
}

.fantasy-tab::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: #B45309;
  transition: width 0.3s;
}

.fantasy-tab:hover::before {
  width: 100%;
}
```

## Effects & Animations

### Ambient Effects
1. **Candle Flicker** - Subtle opacity animation on light sources
2. **Fog Drift** - Slow parallax background movement
3. **Ember Rise** - Floating particles effect
4. **Blood Drip** - Vertical drip animation for mythic items

### Interaction Feedback
1. **Item Hover** - Scale + glow effect
2. **Button Press** - Inner shadow + slight scale down
3. **Tab Switch** - Slide + fade transition
4. **Panel Open** - Drawer/door opening animation

### Quality Glow Effects
```css
.quality-uncommon { box-shadow: 0 0 8px rgba(34, 197, 94, 0.4); }
.quality-rare { box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
.quality-epic { box-shadow: 0 0 12px rgba(153, 27, 27, 0.6); }
.quality-legendary { 
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.8);
  animation: legendary-pulse 2s infinite;
}
.quality-mythic { 
  box-shadow: 0 0 18px rgba(220, 38, 38, 0.8);
  animation: mythic-flame 1.5s infinite;
}
```

## Anti-Patterns (Avoid)

### ❌ Don't Use
1. **Flat design** - No gradients, no shadows, no depth
2. **Web-style navigation** - Top navbar with dropdown menus
3. **Clean white backgrounds** - Breaks immersion
4. **Standard rounded corners** - Use sharp or minimally rounded (2-4px)
5. **Blue link colors** - Use themed accent colors
6. **Material shadows** - Use custom game shadows
7. **Stock photos** - Use stylized icons or illustrations
8. **Emoji icons** - Use SVG icons only

### ✅ Do Use
1. **Dark, moody atmosphere** - Deep blacks with accent lighting
2. **Corner decorations** - Ornamental borders
3. **Texture overlays** - Noise, grunge, paper texture
4. **Gold/amber accents** - For important elements
5. **Glow effects** - Especially for rare items
6. **Custom fonts** - Cinzel for headings
7. **Themed icons** - Fantasy-style SVG icons

## Implementation Checklist

- [ ] Replace flat backgrounds with gradient + texture
- [ ] Add corner decorations to cards
- [ ] Style tabs with fantasy theme
- [ ] Add glow effects to quality items
- [ ] Replace web-style header with HUD overlay
- [ ] Add ambient animations
- [ ] Style buttons with gradient + border
- [ ] Add sound-ready hover states
- [ ] Use Cinzel font for titles
- [ ] Add depth with shadows and borders
