// Registry of episodes. scripts/new-episode.mjs adds new ones above the marker.
import type { EpisodeDef } from "./shared/types";
import { EP01 } from "./ep01";
import { EP02 } from "./ep02";
// @new-episode-import

export const EPISODES: EpisodeDef[] = [
  EP01,
  EP02,
  // @new-episode-entry
];
