(function() {
    'use strict';

    module.exports = function(make, resolve, reject) {
        var npmdir;

        make.sh.exec('npm update codemirror');

        npmdir = make.CLI.expandPath('~npm_dir');
        make.sh.cd(make.path.join(npmdir, 'codemirror'));

        make.sh.exec('npm install -d');

        make.sh.exec('mkdir ../../deps/codemirror');
        make.sh.exec('cp -f -R lib ../../deps/codemirror/');

        make.sh.exec('mkdir ../../deps/codemirror/mode');
        make.sh.exec('cp -f -R mode/javascript ../../deps/codemirror/mode');
        make.sh.exec('cp -f -R mode/xml ../../deps/codemirror/mode');
        make.sh.exec('cp -f -R mode/css ../../deps/codemirror/mode');

        make.sh.exec('mkdir ../../deps/codemirror/addon');

        make.sh.exec('mkdir ../../deps/codemirror/addon/search');
        make.sh.exec('cp -f -R addon/search/searchcursor.js ' +
                '../../deps/codemirror/addon/search');

        make.sh.exec('mkdir ../../deps/codemirror/addon/runmode');
        make.sh.exec('cp -f -R addon/runmode/runmode.js ' +
                '../../deps/codemirror/addon/runmode');

        make.sh.exec('mkdir ../../deps/codemirror/addon/hint');
        make.sh.exec('cp -f -R addon/hint/show-hint.js ' +
                '../../deps/codemirror/addon/hint');
        make.sh.exec('cp -f -R addon/hint/show-hint.css ' +
                '../../deps/codemirror/addon/hint');

        resolve();
    };

}());
