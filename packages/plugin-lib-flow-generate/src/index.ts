import { StartPlugin } from '@start/plugin-sequence'

export default (outDirRelative: string, ...flowArgs: string[]) => {
  const flowGenerate: StartPlugin = async ({ input, log }) => {
    const { default: path } = require('path')
    const { default: execa } = require('execa')

    const outDir = path.resolve(outDirRelative)
    const flowBinPath = path.resolve('node_modules/.bin/flow')

    const spawnOptions = {
      stripEof: false,
      env: {
        FORCE_COLOR: '1',
      },
    }

    return Promise.all(
      input.map((file) =>
        execa(
          'node',
          [flowBinPath, 'gen-flow-files', file.path, '--out-dir', outDir, ...flowArgs],
          spawnOptions
        ).then(() => {
          log(path.join(outDir, `${path.basename(file.path)}.flow`))

          return file
        })
      )
    )
  }

  return flowGenerate
}
