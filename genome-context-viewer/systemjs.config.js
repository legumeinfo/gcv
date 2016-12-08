/**
 * System configuration for Angular samples
 * Adjust as necessary for your application needs.
 */
(function (global) {
  System.config({
    paths: {
      // paths serve as alias
      'npm:': 'node_modules/'
    },
    // map tells the System loader where to look for things
    map: {
      // our app is within the app folder
      app: 'app',
      // angular bundles
      '@angular/core': 'npm:@angular/core/bundles/core.umd.js',
      '@angular/common': 'npm:@angular/common/bundles/common.umd.js',
      '@angular/compiler': 'npm:@angular/compiler/bundles/compiler.umd.js',
      '@angular/platform-browser': 'npm:@angular/platform-browser/bundles/platform-browser.umd.js',
      '@angular/platform-browser-dynamic': 'npm:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
      '@angular/http': 'npm:@angular/http/bundles/http.umd.js',
      '@angular/router': 'npm:@angular/router/bundles/router.umd.js',
      '@angular/forms': 'npm:@angular/forms/bundles/forms.umd.js',
      '@angular/upgrade': 'npm:@angular/upgrade/bundles/upgrade.umd.js',
      // other libraries
      '@ngrx/core':              'npm:@ngrx/core',
      '@ngrx/store':             'npm:@ngrx/store',
      '@ngrx/store-devtools':    'npm:@ngrx/store-devtools',
      '@ngrx/store-log-monitor': 'npm:@ngrx/store-log-monitor',
      'rxjs':                    'npm:rxjs',
    },
    // packages tells the System loader how to load when no filename and/or no extension
    packages: {
      app: {
        main: './main.js',
        defaultExtension: 'js'
      },
      '@ngrx/core': {
        main: '/bundles/core.min.umd.js',
        defaultExtension: 'js'
      },
      '@ngrx/store': {
        main: '/bundles/store.min.umd.js',
        defaultExtension: 'js'
      },
      '@ngrx/store-devtools': {
        main: '/bundles/store-devtools.min.umd.js',
        defaultExtension: 'js'
      },
      '@ngrx/store-log-monitor': {
        main: '/bundles/store-log-monitor.min.umd.js',
        defaultExtension: 'js'
      },
      rxjs: {
        defaultExtension: 'js'
      }
    }
  });
})(this);
