var gulp = require('gulp'),
    install = require('gulp-install'),
    conflict = require('gulp-conflict'),
    template = require('gulp-template'),
    es = require('event-stream'),
    inquirer = require('inquirer'),
    tsd = require('gulp-tsd');

var destination = 'test/';

gulp.task('default', ['tsd']);

gulp.task('tsd', ['generate'], function (callback) {
    tsd({
        command: 'reinstall',
        config: destination + 'tsd.json'
    }, callback);
});

gulp.task('generate', function (done) {
  var workingDirName = process.cwd().split('/').pop().split('\\').pop();

  inquirer.prompt([
    {type: 'input', name: 'appname', message: 'What will your app be called?', default: workingDirName},
    {type: 'input', name: 'ts', message: 'typescript or javascript?', default: 'javascript'}
  ],
  function (answers) {
    if (!answers.appname) {
      return done();
    }

    answers = addPackages(answers);
    answers = cleanName(answers);

    var scriptDir = 'javascript';
    if (useTypescript(answers)) {
      scriptDir = 'typescript';
    }
    gulp.src([__dirname + '/templates/' + scriptDir + '/**',
        '!' + __dirname + '/templates/' + scriptDir + '/typings',
        '!' + __dirname + '/templates/' + scriptDir + '/typings/**'])  // Note use of __dirname to be relative to generator
      .pipe(template(answers, { interpolate: /<%=([\s\S]+?)%>/g }))                 // Lodash template support
      .pipe(conflict(destination))                    // Confirms overwrites on file conflicts
      .pipe(gulp.dest(destination));                   // Without __dirname here = relative to cwd

    gulp.src(__dirname + '/templates/root/src/favicon.ico')
      .pipe(conflict(destination + '/src/'))
      .pipe(gulp.dest(destination + '/src/'));

    gulp.src([
        __dirname + '/templates/root/**',
        '!' + __dirname + '/templates/root/src/favicon.ico',
      ])  // Note use of __dirname to be relative to generator
      .pipe(template(answers))                 // Lodash template support
      .pipe(conflict(destination))                    // Confirms overwrites on file conflicts
      .pipe(gulp.dest(destination))                   // Without __dirname here = relative to cwd
      .pipe(install())                      // Run `bower install` and/or `npm install` if necessary
      .on('end', function () {
            done();       // Finished!
      })
      .resume();
  });
});

function addPackages(answers) {
  var packageDelimiter = ',\n\t\t';
  var packages = [];
  var devPackages = [];
  answers.packages = '';
  answers.devPackages = '';

  if (useTypescript(answers)) {
    devPackages.push('gulp-typescript');
    devPackages.push('typescript-require');
    devPackages.push('typescript-node');
    devPackages.push('del');
  }

  packages.forEach(function(package, index) {
    answers.packages += packageDelimiter + '"' + package + '": "*"';
  });
  devPackages.forEach(function(package, index) {
    answers.devPackages += packageDelimiter + '"' + package + '": "*"';
  });
  return answers;
}

function useTypescript(answers) {
  return answers.ts.indexOf('typescript') != -1 ||
    answers.ts.indexOf('ts') != -1;
}

function cleanName(answers) {
  answers.appname = answers.appname.split(' ').join('-');
  return answers;
}