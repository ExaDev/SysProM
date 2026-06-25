export {
	detectSpecKitProject,
	listFeatures,
	getFeature,
	resolveConstitution,
	type SpecKitProject,
	type SpecKitFeature,
} from "./project.js";

export {
	parseConstitution,
	parseSpec,
	parsePlan,
	parseTasks,
	parseChecklist,
	parseSpecKitFeature,
	type ParseResult,
} from "./parse.js";

export {
	generateConstitution,
	generateSpec,
	generatePlan,
	generateTasks,
	generateChecklist,
	generateSpecKitProject,
} from "./generate.js";

// plan.ts moved to @sysprom/core (it is pure); re-export so existing
// `import { ... } from "sysprom/src/speckit"` callers keep resolving.
export {
	initDocument,
	addTask,
	setTaskLifecycle,
	planStatus,
	planProgress,
	checkGate,
	isTaskDone,
	countTasks,
	type PlanStatus,
	type PhaseProgress,
	type GateIssue,
	type GateResult,
	type BlockageReason,
	type TaskBlockage,
} from "@sysprom/core/speckit/plan.js";
