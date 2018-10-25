import typescript from 'rollup-plugin-typescript2'
import sourceMaps from 'rollup-plugin-sourcemaps'
import pkg from './package.json'

export default {
    input: './autocomplete.ts',
    output: [
        {
            file: pkg.main,
            format: 'umd',
            sourcemap: true,
            name: 'autocomplete'
        }
    ],
    plugins: [
        typescript({
            typescript: require('typescript'),
        }),
        sourceMaps()
    ]
}
