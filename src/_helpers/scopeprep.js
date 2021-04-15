const RESERVED_ARRAY = [
  // Reserved and used at ECMAScript 4
  "as",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "is",
  "namespace",
  "new",
  "null",
  "package",
  "private",
  "public",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "use",
  "var",
  "void",
  "while",
  "with",
  // Reserved for future use at ECMAScript 4
  "abstract",
  "debugger",
  "enum",
  "goto",
  "implements",
  "interface",
  "native",
  "protected",
  "synchronized",
  "throws",
  "transient",
  "volatile",
  // Reserved in ECMAScript 3, unreserved at 4 best to avoid anyway
  "boolean",
  "byte",
  "char",
  "double",
  "final",
  "float",
  "int",
  "long",
  "short",
  "static",

  // I have seen the following list as 'best avoided for function names'
  // but it seems way to all encompassing, so I'm not going to include it
  /*
  "alert", "anchor", "area", "arguments", "array", "assign", "blur",
  "boolean", "button", "callee", "caller", "captureevents", "checkbox",
  "clearinterval", "cleartimeout", "close", "closed", "confirm",
  "constructor", "date", "defaultstatus", "document", "element", "escape",
  "eval", "fileupload", "find", "focus", "form", "frame", "frames",
  "getclass", "hidden", "history", "home", "image", "infinity",
  "innerheight", "isfinite", "innerwidth", "isnan", "java", "javaarray",
  "javaclass", "javaobject", "javapackage", "length", "link", "location",
  "locationbar", "math", "menubar", "mimetype", "moveby", "moveto",
  "name", "nan", "navigate", "navigator", "netscape", "number", "object",
  "onblur", "onerror", "onfocus", "onload", "onunload", "open", "opener",
  "option", "outerheight", "outerwidth", "packages", "pagexoffset",
  "pageyoffset", "parent", "parsefloat", "parseint", "password",
  "personalbar", "plugin", "print", "prompt", "prototype", "radio", "ref",
  "regexp", "releaseevents", "reset", "resizeby", "resizeto",
  "routeevent", "scroll", "scrollbars", "scrollby", "scrollto", "select",
  "self", "setinterval", "settimeout", "status", "statusbar", "stop",
  "string", "submit", "sun", "taint",  "text", "textarea", "toolbar",
  "top", "tostring", "unescape", "untaint", "unwatch", "valueof", "watch",
  "window",
  */
];

function getString(s, i) {
  var targEndChar = s.charAt(i++);
  var string = targEndChar;
  while (i < s.length && s.charAt(i) != targEndChar) {
    string += s.charAt(i++);
  }
  if (i < s.length) {
    string += targEndChar; i++;
  }
  return { string: string, i: i };
}
function getNextChar(s, i) {
  return (i + 1) >= s.length ? '' : s.charAt(i + 1);
}
function getIdentifier(s, i) {
  var string = s.charAt(i++);
  while (i < s.length) {
    var ch = s.charAt(i);
    if (idChars.test(ch)) {
      string += ch; i++;
    } else {
      var nextChar = getNextChar(s, i);
      if ((ch == ' ' && nextChar == '.') || (ch == '.' && nextChar == ' ')) {
        string += '.'; i += 2;
      } else {
        i--;
        break;
      }
    }
  }
  return { string: string, i: i };
}

var forbiddenObjects = ['window', 'document', 'history', 'location', 'navigator', 'XMLHttpRequest',
  'WebSocket', 'WindowOrWorkerGlobalScope', 'XMLDocument', 'ServiceWorkerContainer', 'Worker',
  'localStorage'];
const idChars = /[\w\$]/

export default function prepScriptletScope(rootThis, scopedProps, s) {
  var parts = [];
  var curPart = '';
  s = s.replace(/\s+/g, ' ');
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    if (ch == '"' || ch == "'") {
      if (curPart.length > 0) {
        parts.push(curPart);
      }
      var o = getString(s, i);
      curPart = o.string; i = o.i;
      if (curPart.length > 0) parts.push(curPart);
      curPart = '';
      ch = s.charAt(i);
    }
    var isIdChar = idChars.test(ch);
    if (isIdChar) {
      if (curPart.length > 0) {
        parts.push(curPart);
        curPart = '';
      }
      var o = getIdentifier(s, i);
      i = o.i;
      if (s.length > 0) parts.push(o.string)
    } else {
      curPart += ch;
    }
  }
  if (curPart.length>0) parts.push(curPart)

  for (var i = 0; i < parts.length; i++) {
    var firstChar = parts[i].substring(0, 1);
    if (idChars.test(firstChar) && !RESERVED_ARRAY.find(e => (e == parts[i]))) {
      var sections = parts[i].split('.');
      if (forbiddenObjects.find(e => (e.toUpperCase() == sections[0].toUpperCase()))) {
        parts[i] = 'FORBIDDEN';
      } else if (parts[i].charAt(0) != '.') {
        if (rootThis[parts[i]] !== undefined) {
          parts[i] = 'rootThis.' + parts[i];
        } else if (scopedProps && scopedProps[parts[i]] !== undefined) {
          parts[i] = 'scopedProps.' + parts[i];
        }
      }
    }
  }
  return parts.join('');
}
