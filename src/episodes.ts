// Registry of episodes. scripts/new-episode.mjs adds new ones above the marker.
import type { EpisodeDef } from "./shared/types";
import { EP01 } from "./ep01";
import { EP02 } from "./ep02";
import { EP03 } from "./ep03";
import { EP04 } from "./ep04";
import { EP05 } from "./ep05";
// @new-episode-import

export const EPISODES: EpisodeDef[] = [
  EP01,
  EP02,
  EP03,
  EP04,
  EP05,
  // @new-episode-entry
];
