import Typescript from 'typescript'
import typescript from 'rollup-plugin-typescript'

export default {
    input: './src/index.ts',
    output: {
        file: './dist/main.js',
        format: 'cjs'
    },

    plugins: [
        typescript({
            typescript: Typescript
        })
    ]
}
