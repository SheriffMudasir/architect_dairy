import { CalculateMetadataFunction, Composition } from "remotion";
import { Episode, EpisodeProps } from "./ep01/Episode";
import { loadTimeline } from "./ep01/timeline";
import { FPS, H, W } from "./theme";

const calculateMetadata: CalculateMetadataFunction<EpisodeProps> = async () => {
  const timeline = await loadTimeline();
  return {
    durationInFrames: Math.ceil(timeline.total * FPS),
    props: { timeline },
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Ep01TokyoStadium"
      component={Episode}
      durationInFrames={FPS * 80}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{ timeline: null }}
      calculateMetadata={calculateMetadata}
    />
  );
};
