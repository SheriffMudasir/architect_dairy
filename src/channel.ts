// Channel-wide display settings, read from studio.config.json (no secrets there).
import config from "../studio.config.json";

export const CHANNEL_NAME: string = config.channel?.name ?? "MY CHANNEL";
