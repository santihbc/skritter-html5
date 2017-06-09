'use strict';

const application = require('./package.json');


exports.config = {
  files: {
    javascripts: {
      joinTo: {
        'js/application.js': /^app[\\/]/,
        'js/libraries.js': /^(node_modules|vendor)[\\/]/,
        'js/mobilelibs.js': /^mobilevendor[\\/]/,
        'js/startup.js': /^startup[\\/]/
      },
    },
    stylesheets: {
      joinTo: {
        'styles/application.css': /^app[\\/]/,
        'styles/libraries.css': /^(node_modules|vendor)[\\/]/,
        'styles/startup.css': /^startup[\\/]/
      }
    },
    templates: {
      joinTo: {
        'js/application.js': /^app[\\/]/,
        'js/startup.js': /^startup[\\/]/
      }

    }
  },
  npm: {
    enabled: true,
    styles: {
      'bootstrap': ['dist/css/bootstrap.css'],
      'bootstrap-daterangepicker': ['daterangepicker.css'],
      'bootstrap-slider': ['dist/css/bootstrap-slider.css'],
      'bootstrap-switch': ['dist/css/bootstrap3/bootstrap-switch.css'],
      'cal-heatmap': ['cal-heatmap.css'],
      'font-awesome': ['css/font-awesome.css'],
      'jqueryui': ['css/jquery-ui.css']
    }
  },
  paths: {
    public: 'public',
    watched: ['app', 'startup', 'vendor']
  },
  plugins: {
    autoReload: {
      delay: 100
    },
    babel: {
      ignore: ['app/data/*', 'node_modules/*', 'vendor/*'],
      presets: ['env']
    },
    replace: {
      mappings: {
        'application-description': application.description,
        'application-language': process.env.PROJECT_LANG || '',
        'application-title': application.title,
        'application-version': application.version,
        'application-thinkLocally': process.env.THINK_LOCALLY
      },
      paths: [
        'public/js/config.js',
        'public/js/application.js',
        'public/js/libraries.js',
        'public/js/startup.js',
        'public/styles/application.css',
        'public/styles/libraries.css',
        'public/styles/startup.css'
      ]
    }
  }
};
