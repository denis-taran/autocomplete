import typescript from 'rollup-plugin-typescript2'
import sourceMaps from 'rollup-plugin-sourcemaps'
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json'

export default {
    input: './autocomplete.ts',
    output: [
        {
            file: pkg.main,
            format: 'umd',
            sourcemap: true,
            name: 'autocomplete'
        }, {
            file: pkg.main.replace('.js', '.min.js'),
            format: 'umd',
            sourcemap: true,
            name: 'autocomplete'
        }
    ],
    plugins: [
        typescript({
            typescript: require('typescript'),
        }),
        sourceMaps(),
        terser({
            sourcemap: true,
            include: [/^.+\.min\.js$/],
            compress: true,
            mangle: true
        })
    ]
}
