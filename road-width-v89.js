// V250: every road looks like the same ordinary road; a highway (level 4) is 1.5× as wide.
export const roadWidthScaleV250=level=>level>=4?1.5:1;
export const detailTrailWidth=level=>(.65+2*.27)*roadWidthScaleV250(level);
export const detailWorldRoadWidth=level=>2*detailTrailWidth(level);
