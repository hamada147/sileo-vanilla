import { build, context } from "esbuild";
import { cpSync, existsSync } from "fs";
import { execSync } from "child_process";

const shared = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  sourcemap: true,
  target: "es2017",
};

const isWatch = process.argv.includes("--watch");

if (isWatch) {
  const ctx = await context({
    ...shared,
    format: "esm",
    outfile: "dist/sileo.mjs",
  });
  await ctx.watch();
  console.log("Watching...");
} else {
  await Promise.all([
    build({ ...shared, format: "esm", outfile: "dist/sileo.mjs" }),
    build({ ...shared, format: "cjs", outfile: "dist/sileo.cjs" }),
    build({
      ...shared,
      format: "iife",
      globalName: "SileoLib",
      outfile: "dist/sileo.iife.js",
      footer: {
        js: "if(typeof window!=='undefined'){window.sileo=SileoLib.sileo;}",
      },
    }),
  ]);
  cpSync("src/styles.css", "dist/styles.css");

  // Generate TypeScript declarations
  execSync("npx tsc --declaration --emitDeclarationOnly --outDir dist --project tsconfig.json", { stdio: "inherit" });
  if (existsSync("dist/index.d.ts")) {
    cpSync("dist/index.d.ts", "dist/index.d.mts");
  }

  console.log("Build complete.");
}
