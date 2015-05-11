'use strict';

var series = require('run-series');
var console = require('console');

var verify = require('../verify-esprima-ast.js');
var operators = require('../operators/');
var checkSubType = require('../check-sub-type.js');

module.exports = binaryExpression;

function binaryExpression(node, meta, callback) {
    var operatorType = operators[node.operator];
    /* istanbul ignore if */
    if (!operatorType) {
        console.warn('skipping operator', node.operator);
        return callback(null);
    }

    var args = [node.left, node.right];

    var tasks = args.map(function verifyArg(arg) {
        return verify.bind(null, arg, meta);
    });
    series(tasks, function onVerified(err, argTypes) {
        if (err) {
            return callback(err);
        }

        var errors = argTypes.map(function check(type, index) {
            if (!type) {
                return new Error('untyped identifier ' +
                    args[index].name);
            }

            return checkSubType(operatorType.args[index], type);
        }).filter(Boolean);

        if (errors.length) {
            return callback(errors[0]);
        }

        // must verify that invoking the operator of the expression
        // is sound. Similar to how we verify callExpression

        callback(null, operatorType.result);
    });
}
