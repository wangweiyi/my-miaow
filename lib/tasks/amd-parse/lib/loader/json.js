var recast = require('recast');

module.exports = function (context, depInfo, module, callback) {
  var types = recast.types;
  var b = types.builders;
  var contents = '';

  try {
    var ast = b.program([
      b.expressionStatement(
        b.callExpression(
          b.identifier('define'),
          [
            b.functionExpression(null, [],  b.blockStatement([
                recast.parse('return ' + module.contents.toString()).program.body[0]
            ]))
          ]
        )
      )
    ]);

    contents = new Buffer(recast.print(ast).code);
    
    // contents = new Buffer('define(function() {\n\treturn '+ module.contents.toString() +'\n})');

  } catch (err) {
    return callback(err);
  }

  context.emitModule(module.src + '.js', contents, callback);
};