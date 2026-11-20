import type { EpisodeDef } from "../shared/types";
import { SCRIPT } from "./script";
import { camAt, worldAt } from "./world";

export const EP02: EpisodeDef = { ...SCRIPT, compositionId: "Ep02Untitled", worldAt, camAt };
