import typescript from "rollup-plugin-typescript2";
import sourceMaps from "rollup-plugin-sourcemaps";
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

export default {
  input: "./autocomplete.ts",
  output: [
    {
      file: pkg.main,
      format: "umd",
      sourcemap: true,
      name: "autocomplete",
    },
    {
      file: pkg.main.replace(".js", ".min.js"),
      format: "umd",
      sourcemap: true,
      name: "autocomplete",
      plugins: [
        terser({
          compress: true,
          mangle: true,
          format: {
            comments: /Copyright/gi,
          },
        }),
      ],
    },
    {
      file: pkg.module,
      format: "es",
      sourcemap: true,
      name: "autocomplete",
    },
    {
      file: pkg.module.replace(".js", ".min.js"),
      format: "es",
      sourcemap: true,
      name: "autocomplete",
      plugins: [
        terser({
          compress: true,
          mangle: true,
          format: {
            comments: /Copyright/gi,
          },
        }),
      ],
    },
  ],
  plugins: [
    typescript({
      typescript: require("typescript"),
    }),
    sourceMaps(),
  ],
};
