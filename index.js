const fs = require('fs-extra');
var decompress = require('decompress');
const tempFolderName = "ClockworkWebBridgeTemp";
const contentFolderName = "/gamefiles";
const templateFolderName = "template";

function build(path) {
    fs.removeSync(tempFolderName);
    fs.mkdirSync(tempFolderName);
    decompress(path, tempFolderName).then(files => {
        var manifest = require("./" + tempFolderName + "/manifest.json");
        fs.removeSync(manifest.name);
        fs.mkdirSync(manifest.name);
        fs.mkdirSync(manifest.name+contentFolderName);
        fs.copySync(tempFolderName+"/"+manifest.scope,manifest.name+contentFolderName);
        fs.copySync(templateFolderName,manifest.name);
        var RTapis = fs.readFileSync(manifest.name+"/clockwork/RTpolyfill.js","utf-8");
        var updatedRTapis = RTapis.replace("/*manifest*/{}",JSON.stringify(manifest));
        fs.writeFileSync(manifest.name+"/clockwork/RTpolyfill.js",updatedRTapis,"utf-8");
        fs.removeSync(tempFolderName);
    });
}

module.exports = build;

var userArguments = process.argv.slice(2);
if (userArguments.length == 1) {
    build(userArguments[0]);
}