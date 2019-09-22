import clear from 'rollup-plugin-clear';
import commonjs from 'rollup-plugin-commonjs';
import rollupGitVersion from 'rollup-plugin-git-version';
import typescript from 'rollup-plugin-typescript2';
import Typescript from 'typescript';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/main.js',
    format: 'cjs'
  },

  plugins: [
    clear({ targets: ['dist'] }),
    commonjs(),
    typescript({ typescript: Typescript }),
    rollupGitVersion()
  ],

  external: ['lodash']
}
