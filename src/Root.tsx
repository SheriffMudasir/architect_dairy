import { CalculateMetadataFunction, Composition } from "remotion";
import { EPISODES } from "./episodes";
import { Episode, EpisodeProps } from "./shared/Episode";
import { loadTimeline } from "./shared/timeline";
import { FPS, H, W } from "./theme";

const calculateMetadata: CalculateMetadataFunction<EpisodeProps> = async ({ props }) => {
  const ep = EPISODES.find((e) => e.id === props.episodeId)!;
  const timeline = await loadTimeline(ep.id, ep.beats);
  return {
    durationInFrames: Math.ceil(timeline.total * FPS),
    props: { ...props, timeline },
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
          defaultProps={{ episodeId: ep.id, timeline: null }}
          calculateMetadata={calculateMetadata}
        />
      ))}
    </>
  );
};
