import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { SysProMDocument, RelationshipType } from "../schema.js";
import { RemoveResult } from "./remove-node.js";

/**
 * Remove a relationship matching from, type, and to. Returns a new document without it.
 * Optionally repairs must_follow chains when removal would break them.
 * @throws {Error} If no matching relationship is found.
 */
export const removeRelationshipOp = defineOperation({
	name: "removeRelationship",
	description:
		"Remove a relationship matching from, type, and to. Throws if the relationship is not found.",
	input: z.object({
		doc: SysProMDocument,
		from: z.string(),
		type: RelationshipType,
		to: z.string(),
		repair: z.boolean().optional(),
	}),
	output: RemoveResult,
	fn({ doc, from, type, to, repair }) {
		const rels = doc.relationships ?? [];
		const idx = rels.findIndex(
			(r) => r.from === from && r.type === type && r.to === to,
		);
		if (idx === -1) {
			throw new Error(`Relationship not found: ${from} ${type} ${to}`);
		}

		const warnings: string[] = [];

		// If repair flag is set and this is a must_follow relationship, prepare repairs first
		const repairs: typeof rels = [];
		if (repair && type === "must_follow") {
			// Find all must_follow relationships from the 'to' node (outgoing)
			const outgoing = rels.filter(
				(r) => r.from === to && r.type === "must_follow",
			);

			// If there are relationships following the target, repair by connecting the source directly
			if (outgoing.length > 0) {
				// Also find all must_follow relationships pointing to the 'from' node (for multi-chain repair)
				const incoming = rels.filter(
					(r) => r.to === from && r.type === "must_follow",
				);

				// If there are incoming relationships, connect them all to outgoing targets
				if (incoming.length > 0) {
					for (const inc of incoming) {
						for (const out of outgoing) {
							const bridgeExists = rels.some(
								(r) =>
									r.from === inc.from &&
									r.to === out.to &&
									r.type === "must_follow",
							);
							if (!bridgeExists) {
								repairs.push({
									from: inc.from,
									to: out.to,
									type: "must_follow",
								});
								warnings.push(`Repaired chain: ${inc.from} → ${out.to}`);
							}
						}
					}
				}

				// Always connect the source node to outgoing targets
				for (const out of outgoing) {
					const bridgeExists = rels.some(
						(r) =>
							r.from === from && r.to === out.to && r.type === "must_follow",
					);
					if (!bridgeExists) {
						repairs.push({
							from: from,
							to: out.to,
							type: "must_follow",
						});
						warnings.push(`Repaired chain: ${from} → ${out.to}`);
					}
				}
			}
		}

		// Remove the specified relationship and add repairs
		const newRelationships = rels
			.filter((r) => !(r.from === from && r.type === type && r.to === to))
			.concat(repairs);

		return {
			doc: {
				...doc,
				relationships:
					newRelationships.length > 0 ? newRelationships : undefined,
			},
			warnings,
		};
	},
});
