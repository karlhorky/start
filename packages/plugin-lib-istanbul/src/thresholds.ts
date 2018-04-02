import { StartPlugin } from '@start/plugin-sequence'

export default (options: {} = {}) => {
  const istanbulThresholds: StartPlugin = async ({ input, log }) => {
    const { default: { createCoverageMap } } = await import('istanbul-lib-coverage')
    const { default: { createSourceMapStore } } = await import('istanbul-lib-source-maps')
    const { default: { summarizers } } = await import('istanbul-lib-report')
    const hooks = await import('./hooks')
    const { default: coverageVariable } = await import('./variable')

    hooks.clearAll()

    if (!global[coverageVariable]) {
      log('no coverage information was collected')

      return input
    }

    const coverageMap = createCoverageMap(global[coverageVariable])
    const sourceMapStore = createSourceMapStore()
    const remappedCoverageMap = sourceMapStore.transformCoverage(coverageMap).map

    const coverageSummary = summarizers
      .flat(remappedCoverageMap)
      .getRoot()
      .getCoverageSummary(true)

    const result = Object.keys(options).reduce((errors, key) => {
      const threshold = options[key]
      const summary = coverageSummary[key]

      // check percentage threshold
      if (threshold > 0) {
        if (summary.pct < threshold) {
          return errors.concat(`${key} percentage: ${summary.pct}% < ${threshold}%`)
        }
      }

      // check gap threshold
      if (threshold < 0) {
        if (summary.covered - summary.total < threshold) {
          return errors.concat(`${key} gap: ${summary.covered} - ${summary.total} < ${threshold}`)
        }
      }

      return errors
    }, [])

    if (result.length > 0) {
      throw result
    }

    return input
  }

  return istanbulThresholds
}
