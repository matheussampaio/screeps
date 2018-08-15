import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'

export default {
  input: './src/index.js',
  output: {
    file: './dist/index.js',
    format: 'es'
  },
  plugins: [resolve(), babel()]
}
