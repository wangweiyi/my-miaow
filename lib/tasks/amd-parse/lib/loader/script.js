// js模块不做处理，原样返回
module.exporst = function(context, depInfo, module, callback) {
  return callback(null, module);
};