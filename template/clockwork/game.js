(function () {
    var CLOCKWORKCONFIG;
    window.onload = function () {

        Object.defineProperty(Array.prototype, 'recursiveForEach', {
            enumerable: false,
            value: function (action, index, cb) {
                var i = index || 0;
                if (i >= this.length) {
                    return cb();
                }
                var that = this;
                return action(this[i], function () { that.recursiveForEach(action, i + 1, cb); });
            }
        });

        var manifest = CLOCKWORKRT.API.getManifest();


        document.body.style["background-color"] = manifest.backgroundColor || "black";

        //List of components, only two operations are allowed: register and get
        CLOCKWORKRT.components = (function () {
            var list = [];
            return {
                register: function (x) {
                    //Array
                    if (x && x.length > 0) {
                        x.forEach(x => list.push(x));
                    }
                    //Element
                    if (x && x.length == undefined) {
                        list.push(x);
                    }
                },
                get: function () {
                    return list;
                }
            };
        })();

        //List of components, only two operations are allowed: register and get
        CLOCKWORKRT.collisions = (function () {
            var list = [];
            return {
                register: function (x) {
                    //Array
                    if (x && x.length > 0) {
                        x.forEach(x => list.push(x));
                    }
                    //Element
                    if (x && x.length == undefined) {
                        list.push(x);
                    }
                },
                get: function () {
                    return list;
                }
            };
        })();

        //List of rendering libraries, plus rendering pipeline
        CLOCKWORKRT.rendering = (function () {
            var renderingLibraries = {
                spritesheet: Spritesheet
            };
            var renderingPipeline = ["spritesheet"]; //By default, the rendering library used is Spritesheet.js
            return {
                register: function (name, constructor) {
                    renderingLibraries[name] = constructor;
                },
                get: function (name) {
                    return renderingLibraries[name];
                },
                setPipeline: function (pipeline) {
                    //This pipeline is an array with all the rendering librarie that have to be used
                    renderingPipeline = pipeline;
                },
                getPipeline: function () {
                    return renderingPipeline;
                }
            };
        })();

        CLOCKWORKCONFIG = {
            enginefps: manifest.enginefps,
            animationfps: manifest.animationfps,
            screenbuffer_width: manifest.screenResolution ? manifest.screenResolution.w : 0,
            screenbuffer_height: manifest.screenResolution ? manifest.screenResolution.h : 0
        };

        Object.keys(manifest.dependencies).recursiveForEach(function (name, cb) {
            CLOCKWORKRT.apps.getDependency(name, manifest.dependencies[name], function (x) {
                eval(x);
                cb();
            });
        }, 0, loadComponents);

        function loadComponents() {
            //If the capability is not defined, block access to internal RT API
            if (!(manifest.capabilities && manifest.capabilities.indexOf("ClockworkRuntimeInternal") >= 0)) {
                CLOCKWORKRT.apps = undefined;
            }
            manifest.components.recursiveForEach(function (file, cb) {
                loadTextFile(CLOCKWORKRT.API.appPath() + "/" + file, function (x) {
                    eval(x); //Dirty AF
                    cb();
                });
            }, 0, readyToGo);
        }

        function readyToGo() {
            var pipeline = CLOCKWORKRT.rendering.getPipeline().map(function (x) { return CLOCKWORKRT.rendering.get(x)(); });
            pipeline.reduce(function (x, y) {
                x.chainWith(y);
            });
            var canvas = document.getElementById("canvas");
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvas.style = "position:absolute;top:0px;left:0px;margin:0px;width:100%;height:100%;";
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            window.onresize = function () {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };
            setUpAnimation(pipeline[0], canvas, function (animLib) { setUpEngine(canvas, animLib); });
        }



        function setUpAnimation(animlib, canvas, callback) {
            var canvasAnimation = animlib;
            canvasAnimation.setUp(canvas, CLOCKWORKCONFIG.animationfps);
            canvasAnimation.setBufferSize(CLOCKWORKCONFIG.screenbuffer_width, CLOCKWORKCONFIG.screenbuffer_height);
            canvasAnimation.setRenderMode(function (contextinput, contextoutput) {
                contextoutput.clearRect(0, 0, contextoutput.canvas.width, contextoutput.canvas.height);
                //All the width available will be used, the aspect ratio will be the same and the image will be centered vertically
                if (contextoutput.canvas.width / contextinput.canvas.width < contextoutput.canvas.height / contextinput.canvas.height) {
                    var xpos = 0;
                    var ypos = (contextoutput.canvas.height - contextinput.canvas.height * contextoutput.canvas.width / contextinput.canvas.width) / 2;
                    var width = contextoutput.canvas.width;
                    var height = (contextinput.canvas.height * contextoutput.canvas.width / contextinput.canvas.width);
                } else {
                    var xpos = (contextoutput.canvas.width - contextinput.canvas.width * contextoutput.canvas.height / contextinput.canvas.height) / 2;
                    var ypos = 0;
                    var width = (contextinput.canvas.width * contextoutput.canvas.height / contextinput.canvas.height);
                    var height = contextoutput.canvas.height;
                }
                contextoutput.drawImage(contextinput.canvas, xpos, ypos, width, height);
            });
            canvasAnimation.setWorkingFolder(CLOCKWORKRT.API.appPath());
            manifest.spritesheets.recursiveForEach(function (file, cb) {
                loadTextFile(CLOCKWORKRT.API.appPath() + "/" + file, function (x) {
                    canvasAnimation.loadSpritesheetJSONObject(JSON.parse(x));
                    cb();
                });
            }, 0, (function (c) { return function () { callback(c) }; })(canvasAnimation));
        }


        function setUpEngine(container, animLib) {
            var engineInstance = new Clockwork();
            CLOCKWORKCONFIG.engine = engineInstance;
            engineInstance.setAnimationEngine(animLib);
            CLOCKWORKRT.collisions.get().map(engineInstance.registerCollision);
            engineInstance.loadComponents(CLOCKWORKRT.components.get());
            manifest.levels.map(x => CLOCKWORKRT.API.appPath() + "/" + x).recursiveForEach(function (x, cb) {
                loadTextFile(x, function (x) {
                    engineInstance.loadLevelsFromJSONobject(JSON.parse(x), cb);
                });
            }, 0, function () {
                if (localStorage.debugMode == "true") {
                    if (localStorage.levelEditor === "true") {
                        engineInstance.registerCollision(mouseCollisions);
                        engineInstance.loadComponents(levelEditorComponents);
                        engineInstance.loadComponents(mouseComponent);
                        loadLevelEditor(engineInstance);
                        var wf = animLib.getWorkingFolder();
                        animLib.setWorkingFolder(null);
                        animLib.loadSpritesheetJSONObject(levelEditorSpriteseets);
                        animLib.setWorkingFolder(wf);
                    }
                    var socket = io(localStorage.debugFrontend);
                    socket.on('setBreakpoints', function (data) {
                        engineInstance.setBreakpoints(data);
                    });
                    socket.on('continueRequest', function () {
                        engineInstance.debug.continue();
                    });
                    socket.on('stepOverRequest', function () {
                        engineInstance.debug.stepOver();
                    });
                    socket.on('stepInRequest', function () {
                        engineInstance.debug.stepIn();
                    });
                    socket.on('stepOutRequest', function () {
                        engineInstance.debug.stepOut();
                    });
                    socket.on('connect', function () {
                        engineInstance.start(CLOCKWORKCONFIG.enginefps, container);
                    });
                    socket.on('eval', function (data) {
                        socket.emit('evalResult', {
                            id: data.id,
                            result: engineInstance.debug.eval(data.expression)
                        });
                    });
                    animLib.debug(function (message) {
                        socket.emit('exception', { msg: message });
                    });
                    engineInstance.setBreakpointHandler(function (event, data) {
                        switch (event) {
                            case 'breakpointHit':
                                socket.emit('breakpointHit', {
                                    bp: data.bp,
                                    vars: data.vars,
                                    engineVars: data.globalvars,
                                    stack: data.stack
                                });
                                break;
                            case 'continue':
                                socket.emit('continue', {});
                                break;
                            case 'error':
                                socket.emit('exception', { msg: data.msg });
                                break;
                            case 'log':
                                socket.emit('log', { msg: data });
                                break;
                        }
                    });
                } else {
                    engineInstance.start(CLOCKWORKCONFIG.enginefps, container);
                }
            });
        }

    };
})();
