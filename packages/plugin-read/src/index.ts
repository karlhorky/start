import { StartPlugin } from '@start/plugin-sequence'

const read: StartPlugin = async ({ input, log }) => {
  const { default: makethen } = await import('makethen')
  const { default: gracefulFs } = await import('graceful-fs')

  const readFile = makethen(gracefulFs.readFile)

  return Promise.all(
    input.map((file) =>
      readFile(file.path, 'utf8').then((data) => {
        log(file.path)

        return {
          ...file,
          data,
        }
      })
    )
  )
}

export default read
