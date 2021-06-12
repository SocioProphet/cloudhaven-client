import _ from 'lodash';

function isObject( obj ) {
  return (((typeof obj)==='object') && !Array.isArray(obj));
}

var obj = {};

obj.checkSyntax = ( vcdn ) => {
  var errors = [];
  function makeFunction( funcType, funcSpec, name ) {
    try {
      if (_.isString(funcSpec)) {
        return Function.apply( null, [funcSpec]);
      } else {
        var getSetObj = null;
        if (funcSpec.set) {
          getSetObj = getSetObj || {};
          getSetObj.set = makeFunction( funcType, funcSpec.set, name+':set' );
        }
        if (funcSpec.get) {
          getSetObj = getSetObj || {};
          getSetObj.get = makeFunction( funcType, funcSpec.get, name+':get' );
        }
        if (getSetObj) return getSetObj;
        var args = funcSpec.args || [];
        args.push(funcSpec.body);
        var func = Function.apply( null, args);
        if (_.isString(func)) {
          throw func;
        }
        return func;
      }
    } catch (e) {
      errors.push(`${funcType} - ${name} error: ${e}`);
    }
  }
  function validateMethods( funcType, methodsJSON ) {
    Object.keys(methodsJSON).forEach(methodName=>{
      var methodObj = methodsJSON[methodName];
      var methodErrors = [];
      if (isObject(methodObj)) {
        var validProps = {args:true, body:true};
        Object.keys(methodObj).forEach(prop =>{
          if (!validProps[prop]) {
            methodErrors.push(`Invalid ${funcType} property "${p}" - (args and/or body required)`);
            if (prop == 'args') {
              if (!Array.isArray(methodObj[prop])) {
                methodErrors.push(`${funcType} ${methodName} property ${prop} type is invalid (must be array).`);
              } else {
                for (var i=0;i<methodObj[prop].length;i++) {
                  var el = methodObj[prop][i];
                  if (!_.isString(el)) {
                    methodErrors.push(`${funcType} ${methodName} argument ${i} type is invalid (must be string).`);
                  }
                }
              }
            } else if (prop == 'body' && !_.isString(methodObj[prop])) {
              methodErrors.push(`${funcType} ${methodName} body type is invalid (must be string).`);
            }
          }
        })
      } else if (_.isString(methodObj)) {
        methodErrors.push(`${funcType} ${methodName} type is invalid (must be string or JSON object)`);
      }
      if (methodErrors.length==0) {
        makeFunction(funcType, methodObj);
      }
      errors = errors.concat(methodErrors);
    })
  }
  function validateComponents( componentsJSON ) {
    if (!Array.isArray(componentsJSON)) {
      errors.push('"components" root property invalid (must be an array of JSON objects).')
    } else {
      for (var i=0;i<componentsJSON.length;i++) {
        if (!isObject(componentsJSON[i])) {
          errors.push(`Component at index $[i] is invalid (must be a JSON object).`);
        }
      }
    }
  }
  function validateExtComponents( extCompJSON ) {
    if (!Array.isArray(extCompJSON)) {
      errors.push('"externalComponents" root property invalid (must be an array of JSON objects).')
    } else {
      for (var i=0;i<extCompJSON.length;i++) {
        var extCompObj = extCompJSON[i];
        if (!isObject(extCompObj)) {
          errors.push(`External component at index $[i] is invalid (must be a JSON object).`);
        } else {
          var validExtCompProps = {organizationId:true, componentId:true};
          Object.keys(extCompObj).forEach(extCompProp =>{
            if (!validExtCompProps[extCompProp]) {
              errors.push(`External component (index ${i}) property ${extCompProp} is not recognized (must be organizationId or componentId)`);
            }
            if (!_.isString(extCompObj[extCompProp])) {
              errors.push(`External component (index ${i}) property ${extCompProp} type is invalid (must be a string).`);
            }
            if (!extCompObj['organizationId'] || !extCompObj['componentId']) {
              errors.push(`External component (index ${i}) missing a required property (both organizationId and componentId required)`);
            }
          })
        }
      }
    }
  }
  function validateAppFrame( appFrameJSON ) {
    var validProps = {name:'string', appBarStyle: 'object', appBarTextClass: 'string', nameTextClass: 'string', menuItems: 'array'};
    Object.keys(appFrameJSON).forEach(prop => {
      var reqType = validProps[prop];
      if (!reqType) {
        errors.push(`Unrecognized appFrame property ${prop}.`)
      } else if ((reqType=='string' && !_.isString(appFrameJSON[prop])) ||
                 (reqType=='object' && !isObject(appFrameJSON[prop])) ||
                 (reqType=='string' && !_.isString(appFrameJSON[prop]))) {
                  errors.push(`appFrame property ${prop} type is invalid (${reqType} required).`)
      }

    })
  }
  function validateUISchema( appFrameJSON ) {

  }
  var validPropertiesMap = {
    components:'array',
    externalComponents:'array',
    requiredUserData:'array',
    dataModel:'object',
    methods:'object',
    computed:'object',
    filters:'object',
    watch:'object',
    appFrame:'object',
    uiSchema:'object'
  };
  Object.keys(vcdn).forEach(p=>{
    var obj = vcdn[p];
    var objType = validPropertiesMap[p];
    if (!objType) {
      errors.push(`Invalid root property "${p}" - (${Object.keys(validPropertiesMap).join(', ')})`);
    }
    if (((objType=='array') && !Array.isArray(obj)) || ((objType=='object') && !isObject(obj))) {
      errors.push(`Root property ${p} type is invalid (Object or Array required)`);
    }
    if (p == 'components') {
      validateComponents( obj );
    } else if (p == 'externalComponents') {
      validateExtComponents( obj );
    } else if (p == 'methods') {
      validateMethods('method',obj);
    } else if (p == 'computed') {
      validateMethods(p,obj);
    } else if (p == 'filters') {
      validateMethods(p,obj);
    } else if (p == 'watch') {
      validateMethods(p,obj);
    } else if (p == 'appFrame') {
      validateAppFrame(obj);
    } else if (p == 'uiSchema') {
      validateUISchema(obj);
    }
})

  return errors.length==0?null:errors;
}

export default obj;