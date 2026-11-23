import type { EpisodeDef } from "../shared/types";
import { SCRIPT } from "./script";
import { camAt, worldAt } from "./world";

export const EP04: EpisodeDef = { ...SCRIPT, compositionId: "Ep04WhoOwnsZahaHadid", worldAt, camAt };
