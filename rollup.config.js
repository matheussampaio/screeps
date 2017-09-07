import Typescript from 'typescript';
import tslint from 'rollup-plugin-tslint';
import typescript from 'rollup-plugin-typescript';

export default {
    input: './src/main.ts',
    output: {
        file: './default/main.js',
        format: 'cjs'
    },

    plugins: [
        typescript({
            typescript: Typescript,
            // options: {
            //     include: ''
            // }
        }),
        // tslint()
    ]
};
