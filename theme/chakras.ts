// theme/chakras.ts
export const chakras = {
    root: "#E53935", // red
    sacral: "#FB8C00", // orange
    solar: "#FDD835", // yellow
    heart: "#43A047", // green
    throat: "#1E88E5", // blue
    thirdEye: "#5E35B1", // indigo
    crown: "#8E24AA", // violet
};

export function chakraColorForPct(pct?: number) {
    if (pct == null) return "rgba(255,255,255,0.12)";
    if (pct <= 14) return chakras.root; // 0–14   Root
    if (pct <= 29) return chakras.sacral; // 15–29  Sacral
    if (pct <= 44) return chakras.solar; // 30–44  Solar Plexus
    if (pct <= 59) return chakras.heart; // 45–59  Heart
    if (pct <= 74) return chakras.throat; // 60–74  Throat
    if (pct <= 89) return chakras.thirdEye; // 75–89  Third Eye
    return chakras.crown; // 90–100 Crown
}

export function chakraLabelForPct(pct?: number) {
    if (pct == null) return "No entry";
    if (pct <= 14) return "Root";
    if (pct <= 29) return "Sacral";
    if (pct <= 44) return "Solar Plexus";
    if (pct <= 59) return "Heart";
    if (pct <= 74) return "Throat";
    if (pct <= 89) return "Third Eye";
    return "Crown";
}
