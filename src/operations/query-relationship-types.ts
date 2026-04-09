import * as z from "zod";
import { defineOperation } from "./define-operation.js";
import { RelationshipType, NodeType } from "../schema.js";
import { RELATIONSHIP_ENDPOINT_TYPES } from "../endpoint-types.js";

/** Information about valid endpoint types for a relationship type. */
export interface RelationshipTypeInfo {
	type: RelationshipType;
	from: NodeType[];
	to: NodeType[];
}

/** Result of querying relationship endpoint types. */
export const QueryRelationshipTypesResult = z.array(
	z.object({
		type: RelationshipType,
		from: z.array(NodeType),
		to: z.array(NodeType),
	}),
);

/** Result type for queryRelationshipTypesOp. */
export type QueryRelationshipTypesResult = z.infer<
	typeof QueryRelationshipTypesResult
>;

/**
 * Query valid endpoint types for all relationship types.
 *
 * Returns a list of relationship types with their valid source and target node types.
 * Useful for discovering valid combinations before attempting to add relationships.
 */
export const queryRelationshipTypesOp = defineOperation({
	name: "query-relationship-types",
	description: "Query valid endpoint types for all relationship types",
	input: z.object({}),
	output: QueryRelationshipTypesResult,
	fn: (): RelationshipTypeInfo[] => {
		return Object.entries(RELATIONSHIP_ENDPOINT_TYPES).map(
			([relType, endpoints]) => ({
				type: RelationshipType.parse(relType),
				from: endpoints.from,
				to: endpoints.to,
			}),
		);
	},
});
