var CLOCKWORKRT = {};
CLOCKWORKRT.API={};
CLOCKWORKRT.API.getManifest= function(){
    return {"name":"VRColors","scope":"gameFiles","components":["components.js","a-frame.js"],"levels":["levels.json"],"spritesheets":["spritesheets.json"],"screenResolution":{"w":1366,"h":768},"dependencies":{},"themeColor":"#4B5","backgroundColor":"#333","tileIcon":"tileIcon.png","enginefps":60,"animationfps":60};
}
CLOCKWORKRT.API.appPath=function(){
    return "/gamefiles";
}
CLOCKWORKRT.apps={};
CLOCKWORKRT.apps.getDependency=function(name,version,callback){
    //Load cached dependencies
    callback();
}