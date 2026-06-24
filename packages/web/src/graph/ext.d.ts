/**
 * Ambient type declarations for Cytoscape extensions that ship without
 * TypeScript definitions.
 */

declare module "cytoscape-fcose" {
	import type { Ext } from "cytoscape";
	/**
	 * The fCoSE layout extension registration function. Call
	 * `cytoscape.use(fcose)` once to register the `fcose` layout name.
	 */
	const fcose: Ext;
	export default fcose;
}
