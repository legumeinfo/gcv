import type { Config } from 'jest';
import presets from 'jest-preset-angular/presets/index.js';

const { createCjsPreset } = presets;

// Path aliases from tsconfig, shared by both projects.
const moduleNameMapper = {
  '^@gcv/(.*)$': '<rootDir>/src/app/$1',
  '^@gcv-assets/(.*)$': '<rootDir>/src/assets/$1',
  '^@gcv-dependencies/(.*)$': '<rootDir>/node_modules/$1',
  '^@gcv-environments/(.*)$': '<rootDir>/src/environments/$1',
};

const config: Config = {
  // The tested code has two distinct natures, so it runs as two projects with
  // no stubbing of any dependency:
  //
  //   engine — the framework-free D3/algorithm engine under src/assets/js/gcv.
  //            Pure TypeScript, so a plain node environment with ts-jest. Fast;
  //            no Angular, no jsdom, no zone.
  //
  //   app    — the Angular/NgRx code under src/app. Uses jest-preset-angular so
  //            the real @angular/core, @ngrx/store and @ngrx/entity run under
  //            jsdom + zone.js, exactly as in production.
  projects: [
    {
      displayName: 'engine',
      testEnvironment: 'node',
      roots: ['<rootDir>/src/assets'],
      testMatch: ['**/*.spec.ts'],
      moduleNameMapper,
      transform: {
        // Transform TS sources plus the ESM builds shipped by the engine's
        // runtime deps (mnemonist, and the d3 family used by common/colors).
        '^.+\\.m?[jt]sx?$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(mnemonist|d3|d3-.*|internmap|delaunator|robust-predicates)/)',
      ],
    },
    {
      displayName: 'app',
      ...createCjsPreset({ tsconfig: 'tsconfig.spec.json' }),
      setupFilesAfterEnv: [
        '<rootDir>/src/setup-jest.ts',
        '<rootDir>/src/setup-jest-app.ts',
      ],
      roots: ['<rootDir>/src/app'],
      testMatch: ['**/*.spec.ts'],
      moduleNameMapper,
      // The app imports the D3-based engine (src/assets/js/gcv), so the d3 family
      // of ESM packages must be transformed here too — extend the preset's
      // ignore list (which otherwise transforms only .mjs and Angular locales).
      transformIgnorePatterns: [
        'node_modules/(?!(.*\\.mjs$|@angular/common/locales/.*\\.js$|' +
          '(?:mnemonist|d3|d3-.*|internmap|delaunator|robust-predicates)/))',
      ],
    },
  ],
};

export default config;
