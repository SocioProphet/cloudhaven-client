export function deepGet( obj, path ) {
  if (!obj || !path) return null;
  return path.split(".").reduce((curObj,p)=>{
    if (curObj == null) {
      return null;
    }
    curObj = curObj[p];
    return curObj;
  }, obj);
}
export function deepSet( obj, path, val ) {
  if (!obj || !path) return null;
  var parts = path.split(".");
  var lastEl = parts.pop();
  var setObj = parts.reduce((curObj,p)=>{
    if (curObj == null) return null;
    curObj = curObj[p];
    return curObj;
  }, obj);
  if (setObj) setObj[lastEl] = val;
}
