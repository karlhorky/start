export type StartFile = {
  path: string,
  data: null | string,
  map: null | {}
}

export type StartFiles = StartFile[]

export type StartPluginPropsBefore = {
  files?: StartFiles,
  reporter: NodeJS.EventEmitter,
  [key: string]: any
}

export type StartPluginPropsAfter = StartPluginPropsBefore & {
  logFile: (file: string) => void,
  logMessage: (message: string) => void,
}

export type StartPluginPropsOut = {
  [key: string]: any
}

export type StartPluginFn = (props: StartPluginPropsAfter) => StartPluginPropsOut | Promise<StartPluginPropsOut> | void
export type StartPluginAsync = (props: StartPluginPropsBefore) => StartPluginPropsOut | Promise<StartPluginPropsOut> | void
export type StartPlugin = StartPluginAsync | Promise<StartPluginAsync>

export default (name: string, pluginFn: StartPluginFn): StartPluginAsync => async ({ reporter, ...rest }) => {
  try {
    reporter.emit('start', name)

    const result = await pluginFn({
      ...rest,
      reporter,
      logFile: (file) => reporter.emit('file', name, file),
      logMessage: (message) => reporter.emit('message', name, message)
    })

    reporter.emit('done', name)

    return {
      reporter,
      ...rest,
      ...result
    }
  } catch (error) {
    reporter.emit('error', name, error)

    throw null
  }
}
