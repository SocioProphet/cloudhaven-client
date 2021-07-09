export function deepGet( obj, path ) {
  if (!obj || !path) return undefined;
  var curObj = obj;
  var parts = path.split(".");
  for (var i=0;i<parts.length;i++) {
    var p = parts[i];
    if (curObj == null || !(curObj instanceof Object)) {
      return undefined;
    }
    if (p in curObj) {
      curObj = curObj[p];
    } else {
      return (parts.length>1 && i==(parts.length-1))?null:undefined;
    }
  };
  return curObj;
}
export function deepSet( obj, path, val ) {
  if (!obj || !path || path.indexOf('[')>0) return undefined;
  var parts = path.split(".");
  var lastEl = parts.pop();
  var setObj = obj;
  for (var i=0;i<parts.length;i++) {
    if (setObj == null || !(setObj instanceof Object)) {
      return undefined;
    }
    var p = parts[i];
    if (p in setObj) {
      setObj = setObj[p];
    } else {
      return undefined;
    }
  };
  if (setObj instanceof Object) {
    setObj[lastEl] = val;
    return val;
  }
  return undefined;
}
