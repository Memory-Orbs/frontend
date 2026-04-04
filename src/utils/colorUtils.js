export const EMOTIONS = [
  "joy",
  "sadness",
  "angry",
  "disgust",
  "fear",
  "anxiety",
  "envy",
  "ennui",
  "embarrassment",
];

export const EMOTION_COLORS = {
  joy: "#FDE047", // Yellow
  sadness: "#3B82F6", // Blue
  angry: "#EF4444", // Red
  disgust: "#22C55E", // Green
  fear: "#A855F7", // Purple
  anxiety: "#F97316", // Orange
  envy: "#14B8A6", // Teal
  ennui: "#64748B", // Slate
  embarrassment: "#F472B6", // Pink
  empty: "#ffffff" // Glass/Empty state
};

export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 1, g: 1, b: 1 };
};
