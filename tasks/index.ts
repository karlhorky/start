import sequence from '@start/plugin-sequence/src/'
import parallel from '@start/plugin-parallel/src/'
import xargs from '@start/plugin-xargs/src/'
import assert from '@start/plugin-assert/src/'
import env from '@start/plugin-env/src/'
import find from '@start/plugin-find/src/'
import findGitStaged from '@start/plugin-find-git-staged/src/'
import remove from '@start/plugin-remove/src/'
import read from '@start/plugin-read/src/'
import babel from '@start/plugin-lib-babel/src/'
import rename from '@start/plugin-rename/src/'
import write from '@start/plugin-write/src/'
import overwrite from '@start/plugin-overwrite/src/'
import watch from '@start/plugin-watch/src/'
import eslint from '@start/plugin-lib-eslint/src/'
import {
  istanbulInstrument,
  istanbulReport,
  istanbulThresholds
} from '@start/plugin-lib-istanbul/src/'
import tape from '@start/plugin-lib-tape/src/'
import typescriptGenerate from '@start/plugin-lib-typescript-generate/src/'
import typescriptCheck from '@start/plugin-lib-typescript-check/src/'
import npmVersion from '@start/plugin-lib-npm-version/src/'
import npmPublish from '@start/plugin-lib-npm-publish/src/'
import codecov from '@start/plugin-lib-codecov/src/'
import tapDiff from 'tap-diff'

import { babelConfigBuild, babelConfigDts } from './config/babel'

export const build = (packageName: string) =>
  sequence(
    find(`packages/${packageName}/src/**/*.+(js|ts)`),
    read,
    babel(babelConfigBuild),
    rename((file) => file.replace(/\.ts$/, '.js')),
    write(`packages/${packageName}/build/`)
  )

export const dts = (packageName: string) =>
  sequence(
    find(`packages/${packageName}/src/**/*.ts`),
    typescriptGenerate(`packages/${packageName}/build/`),
    read,
    babel(babelConfigDts),
    write(`packages/${packageName}/build/`)
  )

export const pack = (packageName: string) =>
  sequence(
    assert(packageName, 'package name is required'),
    env({ NODE_ENV: 'production' }),
    find(`packages/${packageName}/build/`),
    remove,
    parallel(['build', 'dts'])(packageName)
  )

export const packs = xargs('pack')

export const dev = (packageName: string) =>
  watch(`packages/${packageName}/src/**/*.ts`)(
    sequence(
      read,
      babel(babelConfigBuild),
      rename((file) => file.replace(/\.ts$/, '.js')),
      write(`packages/${packageName}/build/`)
    )
  )

export const lint = () =>
  sequence(
    findGitStaged(['packages/*/+(src|test)/**/*.ts', 'tasks/**/*.ts']),
    read,
    eslint(),
    typescriptCheck()
  )

export const lintAll = () =>
  sequence(
    find(['packages/*/+(src|test)/**/*.+(ts|js)', 'tasks/**/*.ts']),
    read,
    eslint(),
    typescriptCheck()
  )

export const fix = () =>
  sequence(
    find(['packages/*/+(src|test)/**/*.+(js|ts)', 'tasks/**/*.ts']),
    read,
    eslint({ fix: true }),
    overwrite
  )

export const test = (packageName: string = '*') =>
  sequence(
    env({ NODE_ENV: 'test' }),
    find(`coverage/`),
    remove,
    find(`packages/${packageName}/src/**/*.ts`),
    istanbulInstrument({ esModules: true, extensions: ['.ts'] }),
    find(`packages/${packageName}/test/**/*.ts`),
    tape(tapDiff),
    istanbulReport(['lcovonly', 'html', 'text-summary'])
  )

export const ci = () =>
  sequence(
    lintAll(),
    test()
  )

export const ciCoverage = () =>
  sequence(
    ci(),
    find('coverage/lcov.info'),
    read,
    codecov
  )

export const publish = (packageName: string, version: string) =>
  sequence(
    assert(packageName, 'package name is required'),
    assert(version, 'package version is required'),
    pack(packageName),
    npmVersion(version, {
      packagePath: `packages/${packageName}`,
      message: `📦 ${packageName}: v%s`
    }),
    npmPublish(`packages/${packageName}`)
  )
