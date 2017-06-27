var CLOCKWORKRT = {};
CLOCKWORKRT.API = {};
CLOCKWORKRT.API.getManifest = function () {
    return /*manifest*/{};
}
CLOCKWORKRT.API.appPath = function () {
    return "gamefiles";
}
CLOCKWORKRT.apps = {};
CLOCKWORKRT.apps.getDependency = function (name, version, callback) {
    //Load cached dependencies
    loadTextFile("dependencies/" + name + "/" + version + ".js", callback);
}