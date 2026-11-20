import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { EPISODES } from "./episodes";
import { Episode, EpisodeProps } from "./shared/Episode";
import { loadTimeline } from "./shared/timeline";
import { FPS, H, W } from "./theme";

const calculateMetadata: CalculateMetadataFunction<EpisodeProps> = async ({ props }) => {
  const ep = EPISODES.find((e) => e.id === props.episodeId)!;
  const timeline = await loadTimeline(ep.id, ep.beats);
  const credits = await fetch(staticFile(`${ep.id}/media/credits.json`))
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);
  // only credit media the episode actually uses
  const used = new Set((ep.inserts ?? []).flatMap((i) => (i.kind === "photo" ? [i.src] : i.kind === "person" && i.photo ? [i.photo] : [])));
  return {
    durationInFrames: Math.ceil(timeline.total * FPS),
    props: { ...props, timeline, credits: (credits as { name: string }[]).filter((c) => used.has(c.name)) as EpisodeProps["credits"] },
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {EPISODES.map((ep) => (
        <Composition
          key={ep.id}
          id={ep.compositionId}
          component={Episode}
          durationInFrames={FPS * 80}
          fps={FPS}
          width={W}
          height={H}
          defaultProps={{ episodeId: ep.id, timeline: null, credits: [] }}
          calculateMetadata={calculateMetadata}
        />
      ))}
    </>
  );
};
