import React from "react";
import { Composition } from "remotion";
import { TemplateComposition, VIDEO_DURATION_FRAMES } from "./TemplateComposition";
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS } from "./constants";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Demo"
    component={TemplateComposition}
    durationInFrames={VIDEO_DURATION_FRAMES}
    fps={VIDEO_FPS}
    width={VIDEO_WIDTH}
    height={VIDEO_HEIGHT}
  />
);
