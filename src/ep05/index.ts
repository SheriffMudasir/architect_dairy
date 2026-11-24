import type { EpisodeDef } from "../shared/types";
import { SCRIPT } from "./script";
import { camAt, worldAt } from "./world";

export const EP05: EpisodeDef = { ...SCRIPT, compositionId: "Ep05FirstAfricanPritzkerWinner", worldAt, camAt };
