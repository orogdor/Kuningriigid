// V175.7a: one level definition for wooden towers, elevated palisades and gates.
// The old Stone Age wall and gate retain their original silhouettes and heights.
// The tall variants are opt-in on persisted buildings with woodFortTierV1757:2.
// Coordinates are in world metres relative to the same building ground plane.
export const WOOD_FORT_V1757=Object.freeze({
 lowTier:1,
 highTier:2,
 walkHeight:7.25,       // logical elevation of a soldier's feet / wall graph
 deckSurface:6.875,    // actual mesh top: tower floor centre 6.7 + 0.35/2
 deckCenter:6.7,
 deckThickness:.35,
 towerParapetTop:8.275
});
export const woodFortTierV1757=b=>b?.woodFortTierV1757===2?2:1;
export const isHighWoodFortV1757=b=>
 !!b&&['palisade','woodgate'].includes(b.type)&&woodFortTierV1757(b)===2;
export const woodenWalkHeightV1757=b=>isHighWoodFortV1757(b)?WOOD_FORT_V1757.walkHeight:null;
