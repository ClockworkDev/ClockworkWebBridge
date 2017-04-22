const fs = require('fs-extra');
var decompress = require('decompress');
var request = require('request');
const tempFolderName = "ClockworkWebBridgeTemp";
const contentFolderName = "/gamefiles";
const templateFolderName = "template";

function build(path) {
    fs.removeSync(tempFolderName);
    fs.mkdirSync(tempFolderName);
    console.log("Decompressing files");
    decompress(path, tempFolderName).then(files => {
        console.log("Reading manifest");
        var manifest = require("./" + tempFolderName + "/manifest.json");
        fs.removeSync(manifest.name);
        fs.mkdirSync(manifest.name);
        fs.mkdirSync(manifest.name + contentFolderName);
        console.log("Copying files");
        fs.copySync(tempFolderName + "/" + manifest.scope, manifest.name + contentFolderName);
        fs.copySync(templateFolderName, manifest.name);
        var RTapis = fs.readFileSync(manifest.name + "/clockwork/RTpolyfill.js", "utf-8");
        var updatedRTapis = RTapis.replace("/*manifest*/{}", JSON.stringify(manifest));
        fs.writeFileSync(manifest.name + "/clockwork/RTpolyfill.js", updatedRTapis, "utf-8");
        fs.removeSync(tempFolderName);
        fs.mkdirSync(manifest.name + "/dependencies");
        console.log("Downloading dependencies");
        for (var name in manifest.dependencies) {
            var version = manifest.dependencies[name];
            downloadDependency(manifest.name, name, version);
        }
    });
}

function downloadDependency(manifestName, name, version) {
    request('http://cwpm.azurewebsites.net/api/packages/' + name + "/" + version, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if (body == "") {
                downloadDependency(manifestName, name, version);
            } else {
                fs.mkdirSync(manifestName + "/dependencies/" + name);
                fs.writeFileSync(manifestName + "/dependencies/" + name + "/" + version, body, "utf-8");
            }
        }
    });
}

module.exports = build;

var userArguments = process.argv.slice(2);
if (userArguments.length == 1) {
    build(userArguments[0]);
}
