import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

function minify() {
  return terser({
    compress: true,
    mangle: true,
    format: {
      comments: /Copyright/gi,
    },
  });
}

export default [
  {
    input: "./autocomplete.ts",
    output: [
      {
        file: pkg.module,
        format: "es",
        sourcemap: true,
      },
      {
        file: "autocomplete.es.js",
        format: "es",
        sourcemap: true,
      },
      {
        file: "autocomplete.es.min.js",
        format: "es",
        sourcemap: true,
        plugins: [minify()],
      },
    ],
    plugins: [
      typescript({
        compilerOptions: {
          declarationDir: ".",
        },
      }),
    ],
  },
  {
    input: "./autocomplete.compat.mjs",
    output: [
      {
        file: "autocomplete.js",
        format: "umd",
        sourcemap: true,
        name: "autocomplete",
        exports: "default",
      },
      {
        file: "autocomplete.min.js",
        format: "umd",
        sourcemap: true,
        name: "autocomplete",
        exports: "default",
        plugins: [minify()],
      },
      {
        file: pkg.main,
        format: "cjs",
        sourcemap: true,
        exports: "default",
      },
    ],
    plugins: [
      typescript({
        compilerOptions: {
          declaration: false,
        },
      }),
    ],
  },
];
