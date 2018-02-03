import Typescript from 'typescript'
import typescript from 'rollup-plugin-typescript'

export default {
    input: './src/main.ts',
    output: {
        file: './dist/main.js',
        format: 'es'
    },

    plugins: [
        typescript({
            typescript: Typescript
        })
    ]
}
