import { stats as computeStats } from "../stats.js";
import { loadDocument } from "../io.js";

export function run(args: string[]): void {
  if (args.length < 1) {
    console.error("Usage: sysprom stats <input>");
    process.exit(1);
  }

  const { doc } = loadDocument(args[0]);
  const s = computeStats(doc);

  console.log(`SysProM Document: ${s.title}`);
  console.log("");

  console.log("Nodes by type:");
  for (const [type, count] of Object.entries(s.nodesByType).sort()) {
    console.log(`  ${type.padEnd(20)} ${count}`);
  }
  console.log(`  ${"TOTAL".padEnd(20)} ${s.totalNodes}`);
  console.log("");

  console.log("Relationships by type:");
  for (const [type, count] of Object.entries(s.relationshipsByType).sort()) {
    console.log(`  ${type.padEnd(20)} ${count}`);
  }
  console.log(`  ${"TOTAL".padEnd(20)} ${s.totalRelationships}`);
  console.log("");

  console.log(`Subsystems:          ${s.subsystemCount}`);
  console.log(`Max subsystem depth: ${s.maxSubsystemDepth}`);
  console.log(`Views:               ${s.viewCount}`);
  console.log(`External references: ${s.externalReferenceCount}`);

  if (Object.keys(s.decisionLifecycle).length > 0) {
    console.log("");
    console.log("Decision lifecycle:");
    for (const [state, count] of Object.entries(s.decisionLifecycle).sort()) {
      console.log(`  ${state.padEnd(20)} ${count}`);
    }
  }

  if (Object.keys(s.changeLifecycle).length > 0) {
    console.log("");
    console.log("Change lifecycle:");
    for (const [state, count] of Object.entries(s.changeLifecycle).sort()) {
      console.log(`  ${state.padEnd(20)} ${count}`);
    }
  }
}
