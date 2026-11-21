// Registry of episodes. scripts/new-episode.mjs adds new ones above the marker.
import type { EpisodeDef } from "./shared/types";
import { EP01 } from "./ep01";
import { EP02 } from "./ep02";
import { EP03 } from "./ep03";
// @new-episode-import

export const EPISODES: EpisodeDef[] = [
  EP01,
  EP02,
  EP03,
  // @new-episode-entry
];
