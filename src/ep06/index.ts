import type { EpisodeDef } from "../shared/types";
import { SCRIPT } from "./script";
import { camAt, worldAt } from "./world";

export const EP06: EpisodeDef = { ...SCRIPT, compositionId: "Ep06Bauhaus", worldAt, camAt };
