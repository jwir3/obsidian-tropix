import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const targetVersion = process.env.npm_package_version;

if (!targetVersion) {
	console.error("Error: No target version found. This script should be run via yarn version.");
	process.exit(1);
}

console.log(`Updating version to ${targetVersion}...`);

// Update manifest.json
let manifest;
try {
	manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
} catch (error) {
	console.error("Error reading manifest.json:", error.message);
	process.exit(1);
}

const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));
console.log("✓ Updated manifest.json");

// Update versions.json
let versions;
try {
	versions = JSON.parse(readFileSync("versions.json", "utf8"));
} catch (error) {
	console.error("Error reading versions.json:", error.message);
	process.exit(1);
}

versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
console.log("✓ Updated versions.json");

// Update dist files if they exist
const distDir = "dist";
if (existsSync(distDir)) {
	const distManifestPath = join(distDir, "manifest.json");
	const distVersionsPath = join(distDir, "versions.json");

	if (existsSync(distManifestPath)) {
		writeFileSync(distManifestPath, JSON.stringify(manifest, null, "\t"));
		console.log("✓ Updated dist/manifest.json");
	}

	if (existsSync(distVersionsPath)) {
		writeFileSync(distVersionsPath, JSON.stringify(versions, null, "\t"));
		console.log("✓ Updated dist/versions.json");
	}
} else {
	console.log("ℹ No dist directory found, skipping dist updates");
}

console.log(`\n🎉 Version bump to ${targetVersion} completed!`);
console.log("Files updated:");
console.log("  - manifest.json");
console.log("  - versions.json");
if (existsSync(distDir)) {
	console.log("  - dist/manifest.json (if exists)");
	console.log("  - dist/versions.json (if exists)");
}

console.log("\nNext steps:");
console.log("1. Review the changes");
console.log("2. Run 'yarn build' to update dist files");
console.log("3. Commit and tag the release");
