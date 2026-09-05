export type PillColor = {
  bg: string;
  fg: string;
};

export type LinkTreeTheme = {
  colors: {
    cream: string;
    ink: string;
    dim: string;
    rose: string;
    brown: string;
    denim: string;
    latte: string;
    border: string;
    scrollTrack: string;
    scrollThumb: string;
    scrollThumbHover: string;
    spiralFront: string;
  };
  pillColors: PillColor[];
};

/* 밝은 교무실 톤 — 밝은 교실톤을 기본으로, 노란 포인트를 차분한 블루로 바꾼 사무실 색감입니다. */
export const theme: LinkTreeTheme = {
  colors: {
    cream: "#FBFCFE",
    ink: "#26364A",
    dim: "#7B8FA6",
    rose: "#E3EEF7",
    brown: "#2F6690",
    denim: "#9DBCD4",
    latte: "#EEF4F9",
    border: "rgba(47,102,144,0.24)",
    scrollTrack: "rgba(238,244,249,0.6)",
    scrollThumb: "linear-gradient(180deg, rgba(47,102,144,0.68), rgba(157,188,212,0.58))",
    scrollThumbHover: "linear-gradient(180deg, rgba(38,54,74,0.78), rgba(157,188,212,0.74))",
    spiralFront: "#5B8FB9"
  },
  pillColors: [
    { bg: "#E3EEF7", fg: "#26364A" },
    { bg: "#2F6690", fg: "#FBFCFE" },
    { bg: "#9DBCD4", fg: "#1E2C3C" },
    { bg: "#EEF4F9", fg: "#26364A" }
  ]
};
