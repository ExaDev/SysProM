import pc from "picocolors";
import { stats as computeStats } from "../stats.js";
import { loadDocument } from "../io.js";

export function run(args: string[]): void {
  if (args.length < 1) {
    console.error("Usage: sysprom stats <input>");
    process.exit(1);
  }

  const { doc } = loadDocument(args[0]);
  const s = computeStats(doc);

  console.log(`${pc.bold("SysProM Document")}: ${s.title}`);
  console.log("");

  console.log(pc.bold("Nodes by type:"));
  for (const [type, count] of Object.entries(s.nodesByType).sort()) {
    console.log(`  ${type.padEnd(20)} ${pc.cyan(String(count))}`);
  }
  console.log(`  ${"TOTAL".padEnd(20)} ${pc.cyan(String(s.totalNodes))}`);
  console.log("");

  console.log(pc.bold("Relationships by type:"));
  for (const [type, count] of Object.entries(s.relationshipsByType).sort()) {
    console.log(`  ${type.padEnd(20)} ${pc.cyan(String(count))}`);
  }
  console.log(`  ${"TOTAL".padEnd(20)} ${pc.cyan(String(s.totalRelationships))}`);
  console.log("");

  console.log(`${pc.dim("Subsystems")}:          ${pc.cyan(String(s.subsystemCount))}`);
  console.log(`${pc.dim("Max subsystem depth")}: ${pc.cyan(String(s.maxSubsystemDepth))}`);
  console.log(`${pc.dim("Views")}:               ${pc.cyan(String(s.viewCount))}`);
  console.log(`${pc.dim("External references")}: ${pc.cyan(String(s.externalReferenceCount))}`);

  if (Object.keys(s.decisionLifecycle).length > 0) {
    console.log("");
    console.log(pc.bold("Decision lifecycle:"));
    for (const [state, count] of Object.entries(s.decisionLifecycle).sort()) {
      console.log(`  ${state.padEnd(20)} ${pc.cyan(String(count))}`);
    }
  }

  if (Object.keys(s.changeLifecycle).length > 0) {
    console.log("");
    console.log(pc.bold("Change lifecycle:"));
    for (const [state, count] of Object.entries(s.changeLifecycle).sort()) {
      console.log(`  ${state.padEnd(20)} ${pc.cyan(String(count))}`);
    }
  }
}
