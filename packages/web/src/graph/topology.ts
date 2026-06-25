/**
 * Pure topology / drawing-geometry utilities for the graph viewer.
 *
 * These functions operate on a laid-out graph (node positions + edges) and have
 * no dependency on Cytoscape or any layout engine, so they are unit-testable.
 */

/** A point in model coordinates. */
export interface Position {
	readonly x: number;
	readonly y: number;
}

/** A directed edge, identified by its endpoint node IDs. */
export interface Edge {
	readonly from: string;
	readonly to: string;
}

/**
 * Orientation of point `c` relative to the directed line `a -> b`: positive if
 * `c` lies to the left (counterclockwise), negative to the right (clockwise),
 * 0 if collinear.
 */
function orientation(a: Position, b: Position, c: Position): number {
	const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
	if (cross > 0) return 1;
	if (cross < 0) return -1;
	return 0;
}

/**
 * Whether segment `p1 -> p2` properly crosses segment `p3 -> p4`: an interior
 * intersection, excluding shared endpoints and collinear overlaps. Two segments
 * properly cross when each segment's endpoints lie on strictly opposite sides
 * of the other.
 */
function segmentsProperlyCross(
	p1: Position,
	p2: Position,
	p3: Position,
	p4: Position,
): boolean {
	const d1 = orientation(p3, p4, p1);
	const d2 = orientation(p3, p4, p2);
	const d3 = orientation(p1, p2, p3);
	const d4 = orientation(p1, p2, p4);
	const opposite1 = (d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0);
	const opposite2 = (d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0);
	return opposite1 && opposite2;
}

/**
 * Count the edge crossings in a laid-out graph: the number of edge pairs whose
 * straight-line segments properly intersect, excluding pairs that share an
 * endpoint (those meet at a node, not a crossing). O(E^2) pairwise, which is
 * fine for the document's edge count.
 *
 * Pure: no side effects, no I/O. Tested without a browser.
 */
export function countEdgeCrossings(
	positions: ReadonlyMap<string, Position>,
	edges: readonly Edge[],
): number {
	let count = 0;
	for (let i = 0; i < edges.length; i++) {
		const e1 = edges[i];
		const p1 = positions.get(e1.from);
		const p2 = positions.get(e1.to);
		if (p1 === undefined || p2 === undefined) continue;
		for (let j = i + 1; j < edges.length; j++) {
			const e2 = edges[j];
			if (
				e1.from === e2.from ||
				e1.from === e2.to ||
				e1.to === e2.from ||
				e1.to === e2.to
			) {
				continue;
			}
			const p3 = positions.get(e2.from);
			const p4 = positions.get(e2.to);
			if (p3 === undefined || p4 === undefined) continue;
			if (segmentsProperlyCross(p1, p2, p3, p4)) count++;
		}
	}
	return count;
}
