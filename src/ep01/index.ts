import type { EpisodeDef } from "../shared/types";
import { SCRIPT } from "./script";
import { camAt, worldAt } from "./world";

export const EP01: EpisodeDef = { ...SCRIPT, compositionId: "Ep01TokyoStadium", worldAt, camAt };
