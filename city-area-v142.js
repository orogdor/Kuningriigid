// 3 residents: 3x3 envelope; 8: 5x5; 18: 7x7; 32: 9x9.
// Population grows with area rather than requiring a fixed 32 residents per ring.
export function populationCityRadius(pop){return Math.max(1,Math.floor(Math.sqrt(Math.max(0,Number(pop)||0)/2)));}
export function grownCityRadius(previous,pop){return Math.max(1,Number(previous)||1,populationCityRadius(pop));}

export const nextCityPopulation=radius=>2*(Math.max(1,Math.floor(radius))+1)**2;
