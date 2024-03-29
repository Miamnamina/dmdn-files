module.exports = function(grunt) {

  grunt.initConfig({

    uglify: {
      all: {
        options: {
          compress: true,
          beautify: false,
          sourceMap: true
        },
        files: {
          "./synced-timelines.min.js": [
            "./synced-timelines.js"
          ]
        }
      }
    },
    watch: {
      options: {
        livereload: true
      },
      javascript: {
        files: "./synced-timelines.js",
        tasks: ["js"]
      }
    }

  });

  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-watch");

  grunt.registerTask("js", ["uglify"]);
  grunt.registerTask("build", ["js"]);
  grunt.registerTask("default", ["build"]);
}
