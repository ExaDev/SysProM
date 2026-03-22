import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Detected Spec-Kit project structure — root directory and paths to key directories and files. */
export interface SpecKitProject {
	/** Project root directory. */
	root: string;
	/** Path to `.specify/` directory, or null if not found. */
	specifyDir: string | null;
	/** Path to `specs/` directory, or null if not found. */
	specsDir: string | null;
	/** Path to `constitution.md`, or null if not found. */
	constitutionPath: string | null;
}

/** A single Spec-Kit feature with its metadata and file paths. */
export interface SpecKitFeature {
	id: string; // e.g., "001-feature-name"
	number: number; // e.g., 1
	name: string; // e.g., "feature-name"
	dir: string; // full path to the feature directory
	files: {
		spec: string | null;
		plan: string | null;
		tasks: string | null;
		checklist: string | null;
		research: string | null;
		dataModel: string | null;
		quickstart: string | null;
	};
}

/**
 * Detect Spec-Kit project structure from a directory.
 * Looks for .specify/ and specs/ subdirectories.
 */
export function detectSpecKitProject(dir: string): SpecKitProject {
	const specifyDir = checkDir(join(dir, ".specify"));
	const specsDir = checkDir(join(dir, "specs"));

	// Resolve constitution.md - check .specify/memory/ first, then root
	let constitutionPath: string | null = null;
	if (specifyDir) {
		const memoryConstitution = join(specifyDir, "memory", "constitution.md");
		if (existsSync(memoryConstitution)) {
			constitutionPath = memoryConstitution;
		}
	}
	if (!constitutionPath) {
		const rootConstitution = join(dir, "constitution.md");
		if (existsSync(rootConstitution)) {
			constitutionPath = rootConstitution;
		}
	}

	return {
		root: dir,
		specifyDir,
		specsDir,
		constitutionPath,
	};
}

/**
 * List all features in the specs/ directory, sorted by number.
 */
export function listFeatures(project: SpecKitProject): SpecKitFeature[] {
	if (!project.specsDir) {
		return [];
	}

	const features: SpecKitFeature[] = [];
	const featurePattern = /^\d{3}-/;

	try {
		const entries = readdirSync(project.specsDir);

		for (const entry of entries) {
			const featurePath = join(project.specsDir, entry);
			const stat = statSync(featurePath);

			// Only process directories matching the feature pattern
			if (!stat.isDirectory() || !featurePattern.test(entry)) {
				continue;
			}

			const feature = parseFeatureDirectory(featurePath, entry);
			if (feature) {
				features.push(feature);
			}
		}
	} catch {
		// If specs directory cannot be read, return empty list
		return [];
	}

	// Sort by number
	features.sort((a, b) => a.number - b.number);

	return features;
}

/**
 * Get a specific feature by number or name.
 * Matches "001", "001-feature-name", or "feature-name".
 */
export function getFeature(
	project: SpecKitProject,
	idOrName: string,
): SpecKitFeature | null {
	const features = listFeatures(project);

	// Try exact match on id first
	let feature = features.find((f) => f.id === idOrName);
	if (feature) return feature;

	// Try match on name
	feature = features.find((f) => f.name === idOrName);
	if (feature) return feature;

	// Try match on number (e.g., "1" or "001")
	const numberStr = idOrName.padStart(3, "0");
	feature = features.find((f) => f.id.startsWith(numberStr + "-"));
	if (feature) return feature;

	return null;
}

/**
 * Resolve the constitution.md file, checking .specify/memory/ first, then root.
 */
export function resolveConstitution(project: SpecKitProject): string | null {
	return project.constitutionPath;
}

/**
 * Check if a directory exists, return path or null.
 */
function checkDir(path: string): string | null {
	try {
		const stat = statSync(path);
		return stat.isDirectory() ? path : null;
	} catch {
		return null;
	}
}

/**
 * Parse a feature directory and extract metadata and file paths.
 */
function parseFeatureDirectory(
	dir: string,
	dirName: string,
): SpecKitFeature | null {
	// Parse the directory name format: "NNN-feature-name"
	const match = /^(\d{3})-(.+)$/.exec(dirName);
	if (!match) {
		return null;
	}

	const [, numberStr, name] = match;
	const number = parseInt(numberStr, 10);

	return {
		id: dirName,
		number,
		name,
		dir,
		files: {
			spec: checkFile(dir, "spec.md"),
			plan: checkFile(dir, "plan.md"),
			tasks: checkFile(dir, "tasks.md"),
			checklist: checkFile(dir, "checklist.md"),
			research: checkFile(dir, "research.md"),
			dataModel: checkFile(dir, "data-model.md"),
			quickstart: checkFile(dir, "quickstart.md"),
		},
	};
}

/**
 * Check if a file exists in a directory, return path or null.
 */
function checkFile(dir: string, filename: string): string | null {
	const path = join(dir, filename);
	try {
		const stat = statSync(path);
		return stat.isFile() ? path : null;
	} catch {
		return null;
	}
}
