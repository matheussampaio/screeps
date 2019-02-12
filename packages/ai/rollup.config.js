import clear from 'rollup-plugin-clear';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import Typescript from 'typescript';
import screeps from 'rollup-plugin-screeps';

import config from './screeps.json';

const dest = process.env.DEST;

const plugins = [
  clear({ targets: ['dist'] }),
  resolve(),
  commonjs(),
  typescript({ typescript: Typescript }),
]

if (dest) {
  if (config[dest] == null) {
    throw new Error('Invalid upload destination');
  }

  plugins.push(screeps({ config: config[dest], dryRun: false }))
}

export default {
  input: './src/index.ts',
  output: {
    file: './dist/main.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins
}
