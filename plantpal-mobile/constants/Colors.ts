/** PlantPal brand colors — matches web `src/lib/brand/tokens.ts` */
import { Brand as B } from "@/lib/theme";

export { Brand } from "@/lib/theme";

import { Brand } from "@/lib/theme";

const tintColorLight = B.primary;
const tintColorDark = B.growth;

export default {
  light: {
    text: B.text,
    textSecondary: B.textSecondary,
    background: B.background,
    tint: tintColorLight,
    tabIconDefault: B.textSecondary,
    tabIconSelected: tintColorLight,
    card: B.white,
    border: "#E5E7EB",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    background: "#151718",
    tint: tintColorDark,
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    card: "#1E2022",
    border: "#374151",
  },
};
