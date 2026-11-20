import type { EpisodeDef } from "../shared/types";
import { SCRIPT } from "./script";
import { camAt, worldAt } from "./world";

export const __CONST__: EpisodeDef = { ...SCRIPT, compositionId: "__COMP__", worldAt, camAt };
