    var Module;
    if (typeof Module === 'undefined') Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
    if (!Module.expectedDataFileDownloads) {
      Module.expectedDataFileDownloads = 0;
      Module.finishedDataFileDownloads = 0;
    }
    Module.expectedDataFileDownloads++;
    (function() {

      var PACKAGE_PATH;
      if (typeof window === 'object') {
        PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf('/')) + '/');
      } else if (typeof location !== 'undefined') {
        // worker
        PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf('/')) + '/');
      } else {
        throw 'using preloaded data can only be done on a web page or in a web worker';
      }
      var PACKAGE_NAME = '/Users/ajf/Projects/2015/win95.ajf.me/em-dosbox/src/image.data';
      var REMOTE_PACKAGE_BASE = 'otd.data';
      var USE_SPLITTER = !REMOTE_PACKAGE_BASE.toLowerCase().trim().endsWith('.data');
      var CHUNK_SIZE = 1024 * 1024;
      var CHUNKS_COUNT = 11;
      if (typeof Module['locateFilePackage'] === 'function' && !Module['locateFile']) {
        Module['locateFile'] = Module['locateFilePackage'];
        Module.printErr('warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)');
      }
      var REMOTE_PACKAGE_NAME = typeof Module['locateFile'] === 'function' ?
        Module['locateFile'](REMOTE_PACKAGE_BASE) :
        ((Module['filePackagePrefixURL'] || '') + REMOTE_PACKAGE_BASE);
      var REMOTE_PACKAGE_SIZE = 4044146;
      var PACKAGE_UUID = 'a57dbcd5-b296-4352-a8ea-167654cb497d';

      function fetchRemotePackage_default(packageName, packageSize, callback, errback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', packageName, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(event) {
          var packageData = xhr.response;
          callback(packageData);
        };
        xhr.send(null);
        if (Module['setStatus']) Module['setStatus']('Downloading data...');
      };

      function fetchRemotePackage(packageName, packageSize, callback, errback) {
        if (!USE_SPLITTER)
          return fetchRemotePackage_default(packageName, packageSize, callback, errback);
        if (Module['setStatus']) Module['setStatus']('Downloading data...');
        var finished_ = 0;
        var buf = new Uint8Array(packageSize);
        for (var i = 0; i < CHUNKS_COUNT; i++) {
          const i_ = i;
          const xhr = new XMLHttpRequest();
          xhr.open('GET', packageName + '/' + packageName + '-' + (i_ * CHUNK_SIZE) + '.data', true);
          xhr.responseType = 'arraybuffer';
          xhr.onload = function(event) {
            finished_ += 1;
            buf.set(new Uint8Array(xhr.response), i_ * CHUNK_SIZE);
            if (finished_ >= CHUNKS_COUNT) {
              callback(buf);
            }
          };
          xhr.send(null);
        }
      };

      function handleError(error) {
        console.error('package error:', error);
      };

      var fetched = null,
        fetchedCallback = null;
      fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, function(data) {
        if (fetchedCallback) {
          fetchedCallback(data);
          fetchedCallback = null;
        } else {
          fetched = data;
        }
      }, handleError);

      function runWithFS() {

        function assert(check, msg) {
          if (!check) throw msg + new Error().stack;
        }

        function DataRequest(start, end, crunched, audio) {
          this.start = start;
          this.end = end;
          this.crunched = crunched;
          this.audio = audio;
        }
        DataRequest.prototype = {
          requests: {},
          open: function(mode, name) {
            this.name = name;
            this.requests[name] = this;
            Module['addRunDependency']('fp ' + this.name);
          },
          send: function() {},
          onload: function() {
            var byteArray = this.byteArray.subarray(this.start, this.end);

            this.finish(byteArray);

          },
          finish: function(byteArray) {
            var that = this;
            Module['FS_createPreloadedFile'](this.name, null, byteArray, true, true, function() {
              Module['removeRunDependency']('fp ' + that.name);
            }, function() {
              if (that.audio) {
                Module['removeRunDependency']('fp ' + that.name); // workaround for chromium bug 124926 (still no audio with this, but at least we don't hang)
              } else {
                Module.printErr('Preloading file ' + that.name + ' failed');
              }
            }, false, true); // canOwn this data in the filesystem, it is a slide into the heap that will never change
            this.requests[this.name] = null;
          },
        };
        new DataRequest(0, 14693, 0, 0).open('GET', '/ADLIB.ADV');
        new DataRequest(14693, 17781, 0, 0).open('GET', '/ADLIB.COM');
        new DataRequest(17781, 17804, 0, 0).open('GET', '/autoexec.bat');
        new DataRequest(17804, 29417, 0, 0).open('GET', '/dosbox.conf');
        new DataRequest(29417, 32137, 0, 0).open('GET', '/IBMSND.COM');
        new DataRequest(32137, 32360, 0, 0).open('GET', '/LEGENDS.LST');
        new DataRequest(32360, 37608, 0, 0).open('GET', '/MIDPAK.AD');
        new DataRequest(37608, 50330, 0, 0).open('GET', '/MIDPAK.COM');
        new DataRequest(50330, 323978, 0, 0).open('GET', '/OREGON.EXE');
        new DataRequest(323978, 4015305, 0, 0).open('GET', '/OREGON.GXL');
        new DataRequest(4015305, 4015349, 0, 0).open('GET', '/OT.CNF');
        new DataRequest(4015349, 4023655, 0, 0).open('GET', '/PCSPKR.ADV');
        new DataRequest(4023655, 4024005, 0, 0).open('GET', '/PRODUCT.PF');
        new DataRequest(4024005, 4025593, 0, 0).open('GET', '/README');
        new DataRequest(4025593, 4040336, 0, 0).open('GET', '/SBFM.ADV');
        new DataRequest(4040336, 4044112, 0, 0).open('GET', '/SBLASTER.COM');
        new DataRequest(4044112, 4044146, 0, 0).open('GET', '/SETUP.BAT');

        function processPackageData(arrayBuffer) {
          Module.finishedDataFileDownloads++;
          assert(arrayBuffer, 'Loading data file failed.');
          var byteArray = new Uint8Array(arrayBuffer);
          var curr;

          // Reuse the bytearray from the XHR as the source for file reads.
          DataRequest.prototype.byteArray = byteArray;
          DataRequest.prototype.requests['/ADLIB.ADV'].onload();
          DataRequest.prototype.requests['/ADLIB.COM'].onload();
          DataRequest.prototype.requests['/autoexec.bat'].onload();
          DataRequest.prototype.requests['/dosbox.conf'].onload();
          DataRequest.prototype.requests['/IBMSND.COM'].onload();
          DataRequest.prototype.requests['/LEGENDS.LST'].onload();
          DataRequest.prototype.requests['/MIDPAK.AD'].onload();
          DataRequest.prototype.requests['/MIDPAK.COM'].onload();
          DataRequest.prototype.requests['/OREGON.EXE'].onload();
          DataRequest.prototype.requests['/OREGON.GXL'].onload();
          DataRequest.prototype.requests['/OT.CNF'].onload();
          DataRequest.prototype.requests['/PCSPKR.ADV'].onload();
          DataRequest.prototype.requests['/PRODUCT.PF'].onload();
          DataRequest.prototype.requests['/README'].onload();
          DataRequest.prototype.requests['/SBFM.ADV'].onload();
          DataRequest.prototype.requests['/SBLASTER.COM'].onload();
          DataRequest.prototype.requests['/SETUP.BAT'].onload();
          Module['removeRunDependency']('datafile_/Users/ajf/Projects/2015/win95.ajf.me/em-dosbox/src/image.data');

        };
        Module['addRunDependency']('datafile_/Users/ajf/Projects/2015/win95.ajf.me/em-dosbox/src/image.data');

        if (!Module.preloadResults) Module.preloadResults = {};

        Module.preloadResults[PACKAGE_NAME] = {
          fromCache: false
        };
        if (fetched) {
          processPackageData(fetched);
          fetched = null;
        } else {
          fetchedCallback = processPackageData;
        }

      }
      if (Module['calledRun']) {
        runWithFS();
      } else {
        if (!Module['preRun']) Module['preRun'] = [];
        Module["preRun"].push(runWithFS); // FS is not initialized yet, wait for it
      }

    })();

    Module['arguments'] = [ './autoexec.bat' ];

    function stuck_func() {}
    document.getElementById('showLogs').addEventListener('change', function() {
      if (document.getElementById('showLogs').checked) {
        document.getElementById('output').style.display = "block";
      } else {
        document.getElementById('output').style.display = "none";
      }
    });

    document.getElementById('homepage').addEventListener('click', function() {
      location.href = '..';
    });
