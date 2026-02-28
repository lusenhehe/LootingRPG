// shared utilities for map background generation

/**
 * 将 SVG 字符串转换为 CSS background-image 可用的 data URI。
 * 使用 encodeURIComponent 保证跨浏览器兼容。
 */
export const svgUrl = (svg: string): string =>
  `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}")`;
