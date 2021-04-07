export function deepGet( obj, path ) {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((curObj,p)=>{
    if (curObj == null || !(curObj instanceof Object)) {
      return undefined;
    }
    curObj = (p in curObj)?curObj[p]:undefined;
    return curObj;
  }, obj);
}
export function deepSet( obj, path, val ) {
  if (!obj || !path) return null;
  var parts = path.split(".");
  var lastEl = parts.pop();
  var setObj = parts.reduce((curObj,p)=>{
    if (curObj == null || !(curObj instanceof Object)) return null;
    curObj = curObj[p];
    return curObj;
  }, obj);
  if (setObj instanceof Object) setObj[lastEl] = val;
}
