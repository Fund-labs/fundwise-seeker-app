// FundWise brand faces, bundled as real TTFs (not Google fallbacks).
// Android RN cannot pick a weight from a single family reliably, so each
// weight is registered under its own family name and selected explicitly.

export const fonts = {
  display: "Tanker-Regular",
  sans: "GeneralSans-Regular",
  sansMedium: "GeneralSans-Medium",
  sansSemibold: "GeneralSans-Semibold",
  sansBold: "GeneralSans-Bold",
  mono: "JetBrainsMono-Regular",
  monoMedium: "JetBrainsMono-Medium",
  monoSemibold: "JetBrainsMono-SemiBold",
} as const;

export const fontAssets = {
  "Tanker-Regular": require("../../assets/fonts/Tanker-Regular.ttf"),
  "GeneralSans-Regular": require("../../assets/fonts/GeneralSans-Regular.ttf"),
  "GeneralSans-Medium": require("../../assets/fonts/GeneralSans-Medium.ttf"),
  "GeneralSans-Semibold": require("../../assets/fonts/GeneralSans-Semibold.ttf"),
  "GeneralSans-Bold": require("../../assets/fonts/GeneralSans-Bold.ttf"),
  "JetBrainsMono-Regular": require("../../assets/fonts/JetBrainsMono-Regular.ttf"),
  "JetBrainsMono-Medium": require("../../assets/fonts/JetBrainsMono-Medium.ttf"),
  "JetBrainsMono-SemiBold": require("../../assets/fonts/JetBrainsMono-SemiBold.ttf"),
};

// Map a fontWeight string to the matching General Sans family.
// General Sans tops out at Bold (700); 800/900 map down to Bold.
export function sansForWeight(w?: string) {
  switch (w) {
    case "500":
      return fonts.sansMedium;
    case "600":
      return fonts.sansSemibold;
    case "700":
    case "800":
    case "900":
      return fonts.sansBold;
    default:
      return fonts.sans; // 300 / 400
  }
}
