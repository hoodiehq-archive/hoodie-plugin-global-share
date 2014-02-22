module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-shell');

  // Project configuration.
  grunt.initConfig({

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: 'jshint'
    },

    jshint: {
      files: [
        'Gruntfile.js',
        'hoodie.global-share.js',
        'worker.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    simplemocha: {
      options: {
        reporter: 'spec',
        ignoreLeaks: true
      },
      full: { src: ['test/runner.js'] }
    },

    shell: {
      npmLink: {
        command: 'npm link && npm link hoodie-plugin-global-share'
      },
      npmUnlink: {
        command: 'npm unlink && npm unlink hoodie-plugin-global-share'
      },
      installPlugin: {
        command: 'hoodie install global-share'
      },
      removePlugin: {
        command: 'hoodie uninstall global-share'
      }
    }

  });

  // Default task.
  grunt.registerTask('default', [
    'jshint',
    'shell:npmLink',
    'shell:installPlugin',
    'simplemocha:full',
    'shell:npmUnlink',
    'shell:removePlugin'
  ]);

};

