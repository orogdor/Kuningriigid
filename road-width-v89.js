// V251: roads widen with their traffic level again; a highway (level 4) is 1.5× as wide as level 3.
export const roadWidthScaleV250=level=>[0,.78,.9,1.05,1.575][Math.max(0,Math.min(4,Math.floor(level)||0))]||.78;
export const detailTrailWidth=level=>(.65+2*.27)*roadWidthScaleV250(level);
export const detailWorldRoadWidth=level=>2*detailTrailWidth(level);
