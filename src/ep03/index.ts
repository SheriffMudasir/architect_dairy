import type { EpisodeDef } from "../shared/types";
import { SCRIPT } from "./script";
import { camAt, worldAt } from "./world";

export const EP03: EpisodeDef = { ...SCRIPT, compositionId: "Ep03Gherkin", worldAt, camAt };
