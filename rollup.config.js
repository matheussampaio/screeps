import Typescript from 'typescript'
// import tslint from 'rollup-plugin-tslint'
import typescript from 'rollup-plugin-typescript'
// import cleanup from 'rollup-plugin-cleanup'
import rollupGitVersion from 'rollup-plugin-git-version'
import filesize from 'rollup-plugin-filesize'
import uglify from 'rollup-plugin-uglify'
import { minify } from 'uglify-es';
// import rollupUnassert from 'rollup-plugin-unassert'

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
        // uglify({}, minify),
        filesize(),
    ]
};
