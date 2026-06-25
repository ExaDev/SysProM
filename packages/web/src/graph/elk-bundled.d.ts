/**
 * Ambient declaration for the bundled ELK build (`elkjs/lib/elk.bundled.js`).
 *
 * The bundled ELK build runs the layout engine on the main thread without
 * spawning a web worker. The default `elkjs` entry (`lib/main.js`) spawns
 * `elk-worker.min.js` which 404s under Vite; this bundled entry avoids that.
 *
 * Only the default constructor is declared here. The ELK type interfaces
 * (ElkNode, ElkExtendedEdge, etc.) are imported directly from
 * `elkjs/lib/elk-api` — elkjs's own type definitions — in consuming modules.
 */
declare module "elkjs/lib/elk.bundled.js" {
	import type { ELK, ELKConstructorArguments } from "elkjs/lib/elk-api";
	type ElkConstructor = new (args?: ELKConstructorArguments) => ELK;
	const elkConstructor: ElkConstructor;
	export default elkConstructor;
}
