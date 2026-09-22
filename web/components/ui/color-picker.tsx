"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

// =============================================================================
// Types
// =============================================================================

type OklchColor = { l: number; c: number; h: number; a: number };
type ColorFormat = "oklch" | "hex" | "hsl" | "rgb";
type PresetColor = { label: string; value: string };

type ColorPickerProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  format?: ColorFormat;
  showAlpha?: boolean;
  presets?: "tailwind" | PresetColor[];
  className?: string;
};

// =============================================================================
// Color Conversion Utilities
// =============================================================================

function oklchToOklab(l: number, c: number, h: number) {
  const hRad = (h * Math.PI) / 180;
  return { L: l, a: c * Math.cos(hRad), b: c * Math.sin(hRad) };
}

function oklabToOklch(L: number, a: number, b: number) {
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

function oklabToLinearRgb(L: number, a: number, b: number) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return {
    r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

function linearRgbToOklab(r: number, g: number, b: number) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
  const lab = oklchToOklab(l, c, h);
  const lin = oklabToLinearRgb(lab.L, lab.a, lab.b);
  return [
    Math.round(clamp01(linearToSrgb(lin.r)) * 255),
    Math.round(clamp01(linearToSrgb(lin.g)) * 255),
    Math.round(clamp01(linearToSrgb(lin.b)) * 255),
  ];
}

function rgbToOklch(r: number, g: number, b: number) {
  const lab = linearRgbToOklab(srgbToLinear(r / 255), srgbToLinear(g / 255), srgbToLinear(b / 255));
  return oklabToOklch(lab.L, lab.a, lab.b);
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const r1 = r / 255,
    g1 = g / 255,
    b1 = b / 255;
  const max = Math.max(r1, g1, b1),
    min = Math.min(r1, g1, b1);
  const d = max - min,
    l = (max + min) / 2;
  if (d === 0) return [0, 0, l * 100];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max - min);
  let h = 0;
  if (max === r1) h = ((g1 - b1) / d + (g1 < b1 ? 6 : 0)) / 6;
  else if (max === g1) h = ((b1 - r1) / d + 2) / 6;
  else h = ((r1 - g1) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const h1 = h / 360,
    s1 = s / 100,
    l1 = l / 100;
  if (s1 === 0) {
    const v = Math.round(l1 * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let t1 = t;
    if (t1 < 0) t1 += 1;
    if (t1 > 1) t1 -= 1;
    if (t1 < 1 / 6) return p + (q - p) * 6 * t1;
    if (t1 < 1 / 2) return q;
    if (t1 < 2 / 3) return p + (q - p) * (2 / 3 - t1) * 6;
    return p;
  };
  const q = l1 < 0.5 ? l1 * (1 + s1) : l1 + s1 - l1 * s1;
  const p = 2 * l1 - q;
  return [
    Math.round(hue2rgb(p, q, h1 + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h1) * 255),
    Math.round(hue2rgb(p, q, h1 - 1 / 3) * 255),
  ];
}

function rgbToHex(r: number, g: number, b: number, a?: number): string {
  const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  if (a !== undefined && a < 1)
    return (
      hex +
      Math.round(a * 255)
        .toString(16)
        .padStart(2, "0")
    );
  return hex;
}

function hexToRgb(hex: string) {
  let h = hex.replace(/^#/, "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length === 4) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
  };
}

function isInGamut(r: number, g: number, b: number) {
  return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
}

function gamutMapOklch(l: number, c: number, h: number): [number, number, number] {
  let rgb = oklchToRgb(l, c, h);
  if (isInGamut(rgb[0], rgb[1], rgb[2])) return rgb;
  let lo = 0,
    hi = c;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    rgb = oklchToRgb(l, mid, h);
    if (isInGamut(rgb[0], rgb[1], rgb[2])) lo = mid;
    else hi = mid;
  }
  return oklchToRgb(l, lo, h);
}

function parseColor(input: string): OklchColor {
  const s = input.trim().toLowerCase();
  const oklchMatch = s.match(
    /oklch\(\s*([\d.]+)(?:%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)/
  );
  if (oklchMatch) {
    let a = 1;
    if (oklchMatch[4])
      a = oklchMatch[4].endsWith("%") ? parseFloat(oklchMatch[4]) / 100 : parseFloat(oklchMatch[4]);
    return {
      l: parseFloat(oklchMatch[1]),
      c: parseFloat(oklchMatch[2]),
      h: parseFloat(oklchMatch[3]),
      a,
    };
  }
  const hslMatch = s.match(
    /hsla?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)%?\s*[,\s]\s*([\d.]+)%?\s*(?:[,/]\s*([\d.]+%?))?\s*\)/
  );
  if (hslMatch) {
    const [r, g, b] = hslToRgb(
      parseFloat(hslMatch[1]),
      parseFloat(hslMatch[2]),
      parseFloat(hslMatch[3])
    );
    let a = 1;
    if (hslMatch[4])
      a = hslMatch[4].endsWith("%") ? parseFloat(hslMatch[4]) / 100 : parseFloat(hslMatch[4]);
    return { ...rgbToOklch(r, g, b), a };
  }
  const rgbMatch = s.match(
    /rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+%?))?\s*\)/
  );
  if (rgbMatch) {
    let a = 1;
    if (rgbMatch[4])
      a = rgbMatch[4].endsWith("%") ? parseFloat(rgbMatch[4]) / 100 : parseFloat(rgbMatch[4]);
    return {
      ...rgbToOklch(parseFloat(rgbMatch[1]), parseFloat(rgbMatch[2]), parseFloat(rgbMatch[3])),
      a,
    };
  }
  if (s.startsWith("#")) {
    const { r, g, b, a } = hexToRgb(s);
    return { ...rgbToOklch(r, g, b), a };
  }
  return { l: 0.5, c: 0, h: 0, a: 1 };
}

function formatColor(color: OklchColor, format: ColorFormat): string {
  const { l, c, h, a } = color;
  switch (format) {
    case "oklch": {
      const ls = round4(l),
        cs = round4(c),
        hs = round2(h);
      return a < 1 ? `oklch(${ls} ${cs} ${hs} / ${round2(a)})` : `oklch(${ls} ${cs} ${hs})`;
    }
    case "hex": {
      const [r, g, b] = gamutMapOklch(l, c, h);
      return rgbToHex(r, g, b, a < 1 ? a : undefined);
    }
    case "rgb": {
      const [r, g, b] = gamutMapOklch(l, c, h);
      return a < 1 ? `rgba(${r}, ${g}, ${b}, ${round2(a)})` : `rgb(${r}, ${g}, ${b})`;
    }
    case "hsl": {
      const [r, g, b] = gamutMapOklch(l, c, h);
      const [hh, ss, ll] = rgbToHsl(r, g, b);
      return a < 1 ? `hsla(${hh}, ${ss}%, ${ll}%, ${round2(a)})` : `hsl(${hh}, ${ss}%, ${ll}%)`;
    }
  }
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function round4(v: number) {
  return Math.round(v * 10000) / 10000;
}
function round2(v: number) {
  return Math.round(v * 100) / 100;
}

// =============================================================================
// Tailwind CSS v4 Default Palette (OKLCH)
// =============================================================================

type TwPaletteEntry = { name: string; shades: Record<number, [number, number, number]> };

const TAILWIND_PALETTE: TwPaletteEntry[] = [
  {
    name: "Red",
    shades: {
      50: [0.9705, 0.0129, 17.38],
      100: [0.9356, 0.0309, 17.72],
      200: [0.8845, 0.0593, 18.33],
      300: [0.8077, 0.1035, 19.57],
      400: [0.7106, 0.1661, 22.22],
      500: [0.6368, 0.2078, 25.33],
      600: [0.5771, 0.2152, 27.33],
      700: [0.5054, 0.1905, 27.52],
      800: [0.4437, 0.1613, 26.9],
      900: [0.3958, 0.1331, 25.72],
      950: [0.2575, 0.0886, 26.04],
    },
  },
  {
    name: "Orange",
    shades: {
      50: [0.9796, 0.0158, 73.68],
      100: [0.9542, 0.0372, 75.16],
      200: [0.9015, 0.073, 70.7],
      300: [0.8366, 0.1165, 66.29],
      400: [0.7576, 0.159, 55.93],
      500: [0.7049, 0.1867, 47.6],
      600: [0.6461, 0.1943, 41.12],
      700: [0.5534, 0.1739, 38.4],
      800: [0.4698, 0.143, 37.3],
      900: [0.4084, 0.1165, 38.17],
      950: [0.2659, 0.0762, 36.26],
    },
  },
  {
    name: "Amber",
    shades: {
      50: [0.9869, 0.0214, 95.28],
      100: [0.9619, 0.059, 95.62],
      200: [0.9243, 0.1151, 95.75],
      300: [0.879, 0.1534, 91.61],
      400: [0.8369, 0.1644, 84.43],
      500: [0.7686, 0.1647, 70.08],
      600: [0.6658, 0.1574, 58.32],
      700: [0.5553, 0.1455, 49],
      800: [0.4732, 0.1247, 46.2],
      900: [0.4137, 0.1054, 45.9],
      950: [0.2791, 0.0742, 45.64],
    },
  },
  {
    name: "Yellow",
    shades: {
      50: [0.9873, 0.0262, 102.21],
      100: [0.9729, 0.0693, 103.19],
      200: [0.9451, 0.1243, 101.54],
      300: [0.9052, 0.1657, 98.11],
      400: [0.8606, 0.1731, 91.94],
      500: [0.7952, 0.1617, 86.05],
      600: [0.6806, 0.1423, 75.83],
      700: [0.5538, 0.1207, 66.44],
      800: [0.4762, 0.1034, 61.91],
      900: [0.421, 0.0897, 57.71],
      950: [0.2857, 0.0639, 53.81],
    },
  },
  {
    name: "Lime",
    shades: {
      50: [0.9857, 0.0311, 120.76],
      100: [0.9669, 0.0659, 122.33],
      200: [0.9382, 0.1217, 124.32],
      300: [0.8972, 0.1786, 126.67],
      400: [0.8493, 0.2073, 128.85],
      500: [0.7681, 0.2044, 130.85],
      600: [0.6482, 0.1754, 131.68],
      700: [0.5322, 0.1405, 131.59],
      800: [0.4528, 0.1129, 130.93],
      900: [0.405, 0.0956, 131.06],
      950: [0.2741, 0.0688, 132.11],
    },
  },
  {
    name: "Green",
    shades: {
      50: [0.9819, 0.0181, 155.83],
      100: [0.9624, 0.0434, 156.74],
      200: [0.925, 0.0806, 155.99],
      300: [0.8712, 0.1363, 154.45],
      400: [0.8003, 0.1821, 151.71],
      500: [0.7227, 0.1921, 149.58],
      600: [0.6271, 0.1699, 149.21],
      700: [0.5273, 0.1371, 150.07],
      800: [0.4479, 0.1083, 151.33],
      900: [0.3925, 0.0896, 152.54],
      950: [0.2664, 0.0628, 152.93],
    },
  },
  {
    name: "Emerald",
    shades: {
      50: [0.9793, 0.0207, 166.11],
      100: [0.9505, 0.0507, 163.05],
      200: [0.9049, 0.0895, 164.15],
      300: [0.8452, 0.1299, 164.98],
      400: [0.7729, 0.1535, 163.22],
      500: [0.6959, 0.1491, 162.48],
      600: [0.596, 0.1274, 163.23],
      700: [0.5081, 0.1049, 165.61],
      800: [0.4318, 0.0865, 166.91],
      900: [0.378, 0.073, 168.94],
      950: [0.2621, 0.0487, 172.55],
    },
  },
  {
    name: "Teal",
    shades: {
      50: [0.9836, 0.0142, 180.72],
      100: [0.9527, 0.0498, 180.8],
      200: [0.91, 0.0927, 180.43],
      300: [0.8549, 0.1251, 181.07],
      400: [0.7845, 0.1325, 181.91],
      500: [0.7038, 0.123, 182.5],
      600: [0.6002, 0.1038, 184.7],
      700: [0.5109, 0.0861, 186.39],
      800: [0.437, 0.0705, 188.22],
      900: [0.3861, 0.059, 188.42],
      950: [0.2773, 0.0447, 192.52],
    },
  },
  {
    name: "Cyan",
    shades: {
      50: [0.9841, 0.0189, 200.87],
      100: [0.9563, 0.0443, 203.39],
      200: [0.9167, 0.0772, 205.04],
      300: [0.8651, 0.1153, 207.08],
      400: [0.7971, 0.1339, 211.53],
      500: [0.7148, 0.1257, 215.22],
      600: [0.6089, 0.1109, 221.72],
      700: [0.5198, 0.0936, 223.13],
      800: [0.45, 0.0771, 224.28],
      900: [0.3982, 0.0664, 227.39],
      950: [0.3018, 0.0541, 229.7],
    },
  },
  {
    name: "Sky",
    shades: {
      50: [0.9771, 0.0125, 236.62],
      100: [0.9514, 0.0252, 236.82],
      200: [0.9014, 0.0555, 230.9],
      300: [0.8276, 0.1013, 230.32],
      400: [0.7535, 0.139, 232.66],
      500: [0.6847, 0.1479, 237.32],
      600: [0.5876, 0.1389, 241.97],
      700: [0.5, 0.1193, 242.75],
      800: [0.4434, 0.124, 240.79],
      900: [0.3912, 0.0845, 240.88],
      950: [0.2935, 0.0632, 243.16],
    },
  },
  {
    name: "Blue",
    shades: {
      50: [0.9705, 0.0142, 254.6],
      100: [0.9319, 0.0316, 255.59],
      200: [0.8823, 0.0571, 254.13],
      300: [0.8091, 0.0956, 251.81],
      400: [0.7137, 0.1434, 254.62],
      500: [0.6231, 0.188, 259.81],
      600: [0.5461, 0.2152, 262.88],
      700: [0.4882, 0.2172, 264.38],
      800: [0.4244, 0.1809, 265.64],
      900: [0.3791, 0.1378, 265.52],
      950: [0.2823, 0.0874, 267.94],
    },
  },
  {
    name: "Indigo",
    shades: {
      50: [0.9619, 0.0179, 272.31],
      100: [0.9299, 0.0334, 272.79],
      200: [0.8699, 0.0622, 274.04],
      300: [0.7853, 0.1041, 274.71],
      400: [0.6801, 0.1583, 276.93],
      500: [0.5854, 0.2041, 277.12],
      600: [0.5106, 0.2301, 276.97],
      700: [0.4568, 0.2146, 277.02],
      800: [0.3984, 0.1773, 277.37],
      900: [0.3588, 0.1354, 278.7],
      950: [0.2573, 0.0861, 281.29],
    },
  },
  {
    name: "Violet",
    shades: {
      50: [0.9786, 0.0142, 308.3],
      100: [0.9433, 0.0284, 294.59],
      200: [0.8943, 0.0549, 293.28],
      300: [0.8112, 0.1013, 293.57],
      400: [0.709, 0.1592, 293.54],
      500: [0.6056, 0.2189, 292.72],
      600: [0.5413, 0.2466, 293.01],
      700: [0.4907, 0.2412, 292.58],
      800: [0.432, 0.2106, 292.76],
      900: [0.3796, 0.1783, 293.74],
      950: [0.2827, 0.1351, 291.09],
    },
  },
  {
    name: "Purple",
    shades: {
      50: [0.9768, 0.0142, 308.3],
      100: [0.9464, 0.0327, 307.17],
      200: [0.9024, 0.0604, 306.7],
      300: [0.8268, 0.1082, 306.38],
      400: [0.7217, 0.1767, 305.5],
      500: [0.6268, 0.2325, 303.9],
      600: [0.5575, 0.2525, 302.32],
      700: [0.4955, 0.2369, 301.92],
      800: [0.4383, 0.1983, 303.72],
      900: [0.3807, 0.1661, 304.99],
      950: [0.2905, 0.1432, 302.72],
    },
  },
  {
    name: "Fuchsia",
    shades: {
      50: [0.9773, 0.0174, 320.06],
      100: [0.952, 0.036, 318.85],
      200: [0.903, 0.0732, 319.62],
      300: [0.833, 0.1322, 321.43],
      400: [0.7477, 0.207, 322.16],
      500: [0.6668, 0.2591, 322.15],
      600: [0.5915, 0.2569, 322.9],
      700: [0.518, 0.2258, 323.95],
      800: [0.4519, 0.1922, 324.59],
      900: [0.4007, 0.1601, 325.61],
      950: [0.2932, 0.1309, 325.66],
    },
  },
  {
    name: "Pink",
    shades: {
      50: [0.9714, 0.0141, 343.2],
      100: [0.9482, 0.0276, 342.26],
      200: [0.8994, 0.0589, 343.23],
      300: [0.8228, 0.1095, 346.02],
      400: [0.7253, 0.1752, 349.76],
      500: [0.6559, 0.2118, 354.31],
      600: [0.5916, 0.218, 0.58],
      700: [0.5246, 0.199, 3.96],
      800: [0.4587, 0.1697, 3.82],
      900: [0.4078, 0.1442, 2.43],
      950: [0.2845, 0.1048, 3.91],
    },
  },
  {
    name: "Rose",
    shades: {
      50: [0.9694, 0.0151, 12.42],
      100: [0.9414, 0.0297, 12.58],
      200: [0.8924, 0.0559, 10],
      300: [0.8097, 0.1061, 11.64],
      400: [0.7192, 0.169, 13.43],
      500: [0.645, 0.2154, 16.44],
      600: [0.5858, 0.222, 17.58],
      700: [0.5143, 0.1978, 16.93],
      800: [0.4546, 0.1713, 13.7],
      900: [0.4103, 0.1502, 10.27],
      950: [0.2708, 0.1009, 12.09],
    },
  },
];

const SHADE_KEYS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

// =============================================================================
// Canvas Drawing
// =============================================================================

function drawColorArea(canvas: HTMLCanvasElement, hue: number) {
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  if (!ctx) return;
  const { width, height } = canvas;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  for (let y = 0; y < height; y++) {
    const lightness = 1 - y / (height - 1);
    for (let x = 0; x < width; x++) {
      const chroma = (x / (width - 1)) * 0.4;
      const [r, g, b] = gamutMapOklch(lightness, chroma, hue);
      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

function drawHueStrip(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  for (let x = 0; x < width; x++) {
    const hue = (x / (width - 1)) * 360;
    const [r, g, b] = oklchToRgb(0.7, 0.15, hue);
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

function drawAlphaStrip(canvas: HTMLCanvasElement, l: number, c: number, h: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  const [cr, cg, cb] = gamutMapOklch(l, c, h);
  for (let x = 0; x < width; x++) {
    const alpha = x / (width - 1);
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const isLight = (Math.floor(x / 5) + Math.floor(y / 5)) % 2 === 0;
      const bg = isLight ? 255 : 200;
      data[idx] = Math.round(cr * alpha + bg * (1 - alpha));
      data[idx + 1] = Math.round(cg * alpha + bg * (1 - alpha));
      data[idx + 2] = Math.round(cb * alpha + bg * (1 - alpha));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

// =============================================================================
// Hook: Drag
// =============================================================================

function useDrag(onDrag: (x: number, y: number, rect: DOMRect) => void) {
  const ref = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef(false);
  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      dragging.current = true;
      const el = ref.current;
      if (!el) return;
      el.setPointerCapture(e.pointerId);
      onDrag(e.clientX, e.clientY, el.getBoundingClientRect());
    },
    [onDrag]
  );
  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const el = ref.current;
      if (!el) return;
      onDrag(e.clientX, e.clientY, el.getBoundingClientRect());
    },
    [onDrag]
  );
  const handlePointerUp = React.useCallback(() => {
    dragging.current = false;
  }, []);
  return { ref, handlePointerDown, handlePointerMove, handlePointerUp };
}

// =============================================================================
// Sub-components
// =============================================================================

/** Fixed content height for consistent layout across tabs */
const CONTENT_H = "h-48";

function ColorArea({ color, onChange }: { color: OklchColor; onChange: (c: OklchColor) => void }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = 220;
    c.height = 140;
    drawColorArea(c, color.h);
  }, [color.h]);
  const handleDrag = React.useCallback(
    (cx: number, cy: number, rect: DOMRect) => {
      const x = clamp((cx - rect.left) / rect.width, 0, 1);
      const y = clamp((cy - rect.top) / rect.height, 0, 1);
      onChange({ ...color, l: round4(1 - y), c: round4(x * 0.4) });
    },
    [color, onChange]
  );
  const drag = useDrag(handleDrag);
  const thumbX = (color.c / 0.4) * 100,
    thumbY = (1 - color.l) * 100;
  const [tr, tg, tb] = gamutMapOklch(color.l, color.c, color.h);

  return (
    <div
      ref={drag.ref}
      className="relative w-full cursor-crosshair  rounded-sm flex-1"
      onPointerDown={drag.handlePointerDown}
      onPointerMove={drag.handlePointerMove}
      onPointerUp={drag.handlePointerUp}
      role="slider"
      aria-label="Color area: drag to adjust lightness and chroma"
      tabIndex={0}
      onKeyDown={(e) => {
        const s = e.shiftKey ? 0.05 : 0.01;
        if (e.key === "ArrowRight") onChange({ ...color, c: clamp(color.c + s * 0.4, 0, 0.4) });
        else if (e.key === "ArrowLeft") onChange({ ...color, c: clamp(color.c - s * 0.4, 0, 0.4) });
        else if (e.key === "ArrowUp") onChange({ ...color, l: clamp(color.l + s, 0, 1) });
        else if (e.key === "ArrowDown") onChange({ ...color, l: clamp(color.l - s, 0, 1) });
      }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full rounded-sm"
        style={{ imageRendering: "pixelated" }}
      />
      <div
        className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-xs"
        style={{
          left: `${thumbX}%`,
          top: `${thumbY}%`,
          backgroundColor: `rgb(${tr}, ${tg}, ${tb})`,
        }}
      />
    </div>
  );
}

function HueSlider({ hue, onChange }: { hue: number; onChange: (h: number) => void }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = 220;
    c.height = 12;
    drawHueStrip(c);
  }, []);
  const handleDrag = React.useCallback(
    (cx: number, _: number, rect: DOMRect) => {
      onChange(round2(clamp((cx - rect.left) / rect.width, 0, 1) * 360));
    },
    [onChange]
  );
  const drag = useDrag(handleDrag);
  const [r, g, b] = oklchToRgb(0.7, 0.15, hue);
  return (
    <div
      ref={drag.ref}
      className="relative h-2 w-full cursor-pointer rounded-full"
      onPointerDown={drag.handlePointerDown}
      onPointerMove={drag.handlePointerMove}
      onPointerUp={drag.handlePointerUp}
      role="slider"
      aria-label="Hue"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(hue)}
      tabIndex={0}
      onKeyDown={(e) => {
        const s = e.shiftKey ? 10 : 1;
        if (e.key === "ArrowRight") onChange((hue + s) % 360);
        else if (e.key === "ArrowLeft") onChange((hue - s + 360) % 360);
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full rounded-full" />
      <div
        className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
        style={{ left: `${(hue / 360) * 100}%`, backgroundColor: `rgb(${r}, ${g}, ${b})` }}
      />
    </div>
  );
}

function AlphaSlider({ color, onChange }: { color: OklchColor; onChange: (a: number) => void }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = 220;
    c.height = 12;
    drawAlphaStrip(c, color.l, color.c, color.h);
  }, [color.l, color.c, color.h]);
  const handleDrag = React.useCallback(
    (cx: number, _: number, rect: DOMRect) => {
      onChange(round2(clamp((cx - rect.left) / rect.width, 0, 1)));
    },
    [onChange]
  );
  const drag = useDrag(handleDrag);
  const [r, g, b] = gamutMapOklch(color.l, color.c, color.h);
  return (
    <div
      ref={drag.ref}
      className="relative h-2 w-full cursor-pointer rounded-full"
      onPointerDown={drag.handlePointerDown}
      onPointerMove={drag.handlePointerMove}
      onPointerUp={drag.handlePointerUp}
      role="slider"
      aria-label="Opacity"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(color.a * 100)}
      tabIndex={0}
      onKeyDown={(e) => {
        const s = e.shiftKey ? 0.1 : 0.01;
        if (e.key === "ArrowRight") onChange(clamp(color.a + s, 0, 1));
        else if (e.key === "ArrowLeft") onChange(clamp(color.a - s, 0, 1));
      }}
    >
      <canvas ref={canvasRef} className="block h-full w-full rounded-full" />
      <div
        className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
        style={{ left: `${color.a * 100}%`, backgroundColor: `rgba(${r}, ${g}, ${b}, ${color.a})` }}
      />
    </div>
  );
}

// --- Numeric Input -----------------------------------------------------------

function NumField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const [text, setText] = React.useState(String(value));
  React.useEffect(() => {
    setText(String(value));
  }, [value]);
  const commit = () => {
    const n = parseFloat(text);
    if (!isNaN(n)) onChange(clamp(n, min, max));
    else setText(String(value));
  };
  return (
    <div className="flex flex-1 flex-col gap-0.5">
      <label className="text-[10px] font-medium uppercase text-muted-foreground text-center">
        {label}
      </label>
      <Input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "ArrowUp") {
            e.preventDefault();
            onChange(clamp(value + (step ?? 1), min, max));
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            onChange(clamp(value - (step ?? 1), min, max));
          }
        }}
        className="h-7 rounded-lg px-1 text-center text-xs tabular-nums shadow-none"
        aria-label={label}
      />
    </div>
  );
}

// --- Values Tab (full input panel) -------------------------------------------

type InputMode = "oklch" | "hsl" | "rgb" | "hex";

function ValuesPanel({
  color,
  onChange,
  showAlpha,
}: {
  color: OklchColor;
  onChange: (c: OklchColor) => void;
  showAlpha: boolean;
}) {
  const [mode, setMode] = React.useState<InputMode>("oklch");
  const modes: InputMode[] = ["oklch", "hsl", "rgb", "hex"];
  const [r, g, b] = gamutMapOklch(color.l, color.c, color.h);
  const bgColor = color.a < 1 ? `rgba(${r}, ${g}, ${b}, ${color.a})` : `rgb(${r}, ${g}, ${b})`;

  return (
    <div className={cn(CONTENT_H, "flex flex-col gap-3 justify-start")}>
      {/* Preview swatch */}
      <div className="flex items-center gap-3">
        <div className="size-10 shrink-0 rounded-sm" style={{ backgroundColor: bgColor }} />
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">
            Current Color
          </span>
          <span className="text-xs font-mono text-foreground truncate">
            {formatColor(color, mode)}
          </span>
        </div>
      </div>

      {/* Color space tabs */}
      <div className="flex gap-0.5 rounded-lg bg-muted p-0.5">
        {modes.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase transition-colors",
              mode === m
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="flex gap-1">
        {mode === "oklch" && (
          <>
            <NumField
              label="L"
              value={round4(color.l)}
              min={0}
              max={1}
              step={0.01}
              onChange={(l) => onChange({ ...color, l })}
            />
            <NumField
              label="C"
              value={round4(color.c)}
              min={0}
              max={0.4}
              step={0.005}
              onChange={(c) => onChange({ ...color, c })}
            />
            <NumField
              label="H"
              value={round2(color.h)}
              min={0}
              max={360}
              step={1}
              onChange={(h) => onChange({ ...color, h })}
            />
            {showAlpha && (
              <NumField
                label="A"
                value={round2(color.a)}
                min={0}
                max={1}
                step={0.01}
                onChange={(a) => onChange({ ...color, a })}
              />
            )}
          </>
        )}
        {mode === "hsl" &&
          (() => {
            const [hh, ss, ll] = rgbToHsl(r, g, b);
            const update = (h: number, s: number, l: number) => {
              const [nr, ng, nb] = hslToRgb(h, s, l);
              onChange({ ...rgbToOklch(nr, ng, nb), a: color.a });
            };
            return (
              <>
                <NumField
                  label="H"
                  value={hh}
                  min={0}
                  max={360}
                  step={1}
                  onChange={(v) => update(v, ss, ll)}
                />
                <NumField
                  label="S"
                  value={ss}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(v) => update(hh, v, ll)}
                />
                <NumField
                  label="L"
                  value={ll}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(v) => update(hh, ss, v)}
                />
                {showAlpha && (
                  <NumField
                    label="A"
                    value={round2(color.a)}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(a) => onChange({ ...color, a })}
                  />
                )}
              </>
            );
          })()}
        {mode === "rgb" &&
          (() => {
            const update = (nr: number, ng: number, nb: number) =>
              onChange({ ...rgbToOklch(nr, ng, nb), a: color.a });
            return (
              <>
                <NumField
                  label="R"
                  value={r}
                  min={0}
                  max={255}
                  step={1}
                  onChange={(v) => update(v, g, b)}
                />
                <NumField
                  label="G"
                  value={g}
                  min={0}
                  max={255}
                  step={1}
                  onChange={(v) => update(r, v, b)}
                />
                <NumField
                  label="B"
                  value={b}
                  min={0}
                  max={255}
                  step={1}
                  onChange={(v) => update(r, g, v)}
                />
                {showAlpha && (
                  <NumField
                    label="A"
                    value={round2(color.a)}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(a) => onChange({ ...color, a })}
                  />
                )}
              </>
            );
          })()}
        {mode === "hex" && <HexInput color={color} onChange={onChange} showAlpha={showAlpha} />}
      </div>
    </div>
  );
}

function HexInput({
  color,
  onChange,
  showAlpha,
}: {
  color: OklchColor;
  onChange: (c: OklchColor) => void;
  showAlpha: boolean;
}) {
  const [r, g, b] = gamutMapOklch(color.l, color.c, color.h);
  const hex = rgbToHex(r, g, b, showAlpha && color.a < 1 ? color.a : undefined);
  const [text, setText] = React.useState(hex);
  React.useEffect(() => {
    setText(hex);
  }, [hex]);
  const commit = () => {
    const cleaned = text.startsWith("#") ? text : `#${text}`;
    if (/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(cleaned)) {
      const parsed = hexToRgb(cleaned);
      onChange({ ...rgbToOklch(parsed.r, parsed.g, parsed.b), a: parsed.a });
    } else setText(hex);
  };
  return (
    <div className="flex flex-1 flex-col gap-0.5">
      <label className="text-[10px] font-medium uppercase text-muted-foreground text-center">
        Hex
      </label>
      <Input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
        className="h-7 rounded-lg px-1.5 text-center text-xs font-mono tabular-nums shadow-none"
        aria-label="Hex color value"
      />
    </div>
  );
}

// --- Tailwind Panel (vertical columns, horizontal scroll) --------------------

function TailwindPanel({
  color,
  onSelect,
}: {
  color: OklchColor;
  onSelect: (c: OklchColor) => void;
}) {
  return (
    <div className={cn(CONTENT_H, "overflow-x-auto overflow-y-visible rounded-sm")}>
      <div className="flex gap-px h-full">
        {TAILWIND_PALETTE.map((family) => (
          <div key={family.name} className="flex flex-col items-center gap-px shrink-0">
            {SHADE_KEYS.map((shade) => {
              const [l, c, h] = family.shades[shade];
              const [r, g, b] = gamutMapOklch(l, c, h);
              const isActive =
                Math.abs(color.l - l) < 0.005 &&
                Math.abs(color.c - c) < 0.005 &&
                Math.abs(color.h - h) < 0.5;
              return (
                <button
                  key={shade}
                  type="button"
                  title={`${family.name} ${shade}`}
                  aria-label={`${family.name} ${shade}`}
                  className={cn(
                    "w-8 flex-1 rounded-xs transition-all hover:transition-none duration-300 hover:scale-105 focus-visible:border-2 focus-visible:border-foreground",
                    isActive
                      ? "inset-ring-2 inset-ring-foreground/30"
                      : "hover:border-foreground/20"
                  )}
                  style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                  onClick={() => onSelect({ l, c, h, a: 1 })}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Custom Presets ---

function CustomPresetsPanel({
  presets,
  onSelect,
}: {
  presets: PresetColor[];
  onSelect: (c: OklchColor) => void;
}) {
  return (
    <div className={cn(CONTENT_H, "flex flex-wrap content-start gap-1 overflow-y-auto p-0.5")}>
      {presets.map((preset, i) => {
        const parsed = parseColor(preset.value);
        const [r, g, b] = gamutMapOklch(parsed.l, parsed.c, parsed.h);
        return (
          <button
            key={i}
            type="button"
            title={preset.label}
            aria-label={preset.label}
            className="size-7 rounded-sm border border-transparent transition-all hover:scale-110 hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
            onClick={() => onSelect(parsed)}
          />
        );
      })}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

type TopTab = "picker" | "tailwind" | "values";

function ColorPicker({
  value,
  defaultValue,
  onValueChange,
  format = "oklch",
  showAlpha = false,
  presets,
  className,
}: ColorPickerProps) {
  const [internalColor, setInternalColor] = React.useState<OklchColor>(() =>
    parseColor(value ?? defaultValue ?? "oklch(0.7 0.15 230)")
  );
  React.useEffect(() => {
    if (value !== undefined) setInternalColor(parseColor(value));
  }, [value]);

  const hasTailwind = presets === "tailwind";
  const hasCustomPresets = Array.isArray(presets);
  const showTabs = hasTailwind || hasCustomPresets;

  const tabs: { id: TopTab; label: string }[] = [
    { id: "picker", label: "Picker" },
    ...(showTabs
      ? [{ id: "tailwind" as TopTab, label: hasTailwind ? "Tailwind" : "Presets" }]
      : []),
    { id: "values", label: "Values" },
  ];

  const [topTab, setTopTab] = React.useState<TopTab>("picker");
  const color = value !== undefined ? parseColor(value) : internalColor;

  const updateColor = React.useCallback(
    (newColor: OklchColor) => {
      if (value === undefined) setInternalColor(newColor);
      onValueChange?.(formatColor(newColor, format));
    },
    [value, format, onValueChange]
  );

  return (
    <div
      data-slot="color-picker"
      className={cn(
        "flex w-[264px] flex-col gap-0 rounded-xl border bg-popover shadow-lg overflow-hidden",
        className
      )}
    >
      {/* Line-style tabs */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTopTab(tab.id)}
            className={cn(
              "flex-1 py-1 text-[11px] font-medium transition-colors relative",
              topTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {topTab === tab.id && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-foreground" />
            )}
          </button>
        ))}
      </div>

      {/* Content area (fixed height) */}
      <div className="p-2.5">
        {topTab === "picker" && (
          <div className={cn(CONTENT_H, "flex flex-col gap-2")}>
            <ColorArea color={color} onChange={updateColor} />
            <div className="flex items-center gap-1.5">
              <div
                className="size-7 shrink-0 rounded-sm"
                style={{
                  backgroundColor: ((): string => {
                    const [r, g, b] = gamutMapOklch(color.l, color.c, color.h);
                    return color.a < 1 ? `rgba(${r},${g},${b},${color.a})` : `rgb(${r},${g},${b})`;
                  })(),
                }}
              />
              <div className="flex flex-1 flex-col gap-1.5 pr-2">
                <HueSlider hue={color.h} onChange={(h) => updateColor({ ...color, h })} />
                {showAlpha && (
                  <AlphaSlider color={color} onChange={(a) => updateColor({ ...color, a })} />
                )}
              </div>
            </div>
          </div>
        )}

        {topTab === "tailwind" && hasTailwind && (
          <TailwindPanel color={color} onSelect={updateColor} />
        )}
        {topTab === "tailwind" && hasCustomPresets && (
          <CustomPresetsPanel presets={presets} onSelect={updateColor} />
        )}
        {topTab === "values" && (
          <ValuesPanel color={color} onChange={updateColor} showAlpha={showAlpha} />
        )}
      </div>
    </div>
  );
}

export { ColorPicker, parseColor, formatColor };
export type { ColorPickerProps, ColorFormat, OklchColor, PresetColor };
