import Typescript from 'typescript'
import typescript from 'rollup-plugin-typescript'
import rollupGitVersion from 'rollup-plugin-git-version'
import filesize from 'rollup-plugin-filesize'

export default {
    input: './src/main.ts',
    output: {
        file: './default/main.js',
        format: 'cjs'
    },

    plugins: [
        rollupGitVersion(),
        typescript({
            typescript: Typescript
        }),
        filesize()
    ]
};
