///<reference path='../imports.d.ts'/>

// http://docs.python.org/reference/expressions.html#summary
// https://developer.mozilla.org/en/JavaScript/Reference/Operators/Operator_Precedence

import ParserNode = module('./ParserNode');
import TokenParserContext = module('./TokenParserContext');
import StringReader = module('../lexer/StringReader');
import ExpressionTokenizer = module('../lexer/ExpressionTokenizer');
import TokenReader = module('../lexer/TokenReader');

export class ExpressionParser {
	constructor(public tokenReader: TokenReader.TokenReader, private tokenParserContext: TokenParserContext.TokenParserContext) {
		//if (!(this.tokenParserContext instanceof TokenParserContext.TokenParserContext)) { console.log(this.tokenParserContext); throw (new Error("ASSERT!")); }
	}

	parseCommaExpression(): ParserNode.ParserNodeCommaExpression {
		var expressions: ParserNode.ParserNodeExpression[] = []; 
		while (true) {
			expressions.push(this.parseExpression());
			if (this.tokenReader.peek().value != ',') break;
			this.tokenReader.skip();
		}
		return new ParserNode.ParserNodeCommaExpression(expressions);
	}

	parseCommaExpressionWithNames(): ParserNode.ParserNodeCommaExpression {
		var expressions: ParserNode.ParserNodeExpression[] = [];
		var namedCount = 0;
		var names: string[] = [];
		while (true) {
			if (this.tokenReader.peek(1).value == '=') {
				names.push(this.parseIdentifierOnly().value);
				namedCount++;
				this.tokenReader.skip();
			} else {
				names.push(null);
			}
			expressions.push(this.parseExpression());
			if (this.tokenReader.peek().value != ',') break;
			this.tokenReader.skip();
		}
		return new ParserNode.ParserNodeCommaExpression(expressions, (namedCount > 0) ? names : null);
	}

	parseExpression(): ParserNode.ParserNodeExpression {
		return this.parseFunctionCall();
	}

	parseFunctionCall() {
		return this.parseTernary();
	}

	parseTernary() {
		var left = this.parseTernaryShortcut();
		if (this.tokenReader.peek().value == '?') {
			this.tokenReader.skip();
			var middle = this.parseExpression();
			this.tokenReader.expectAndMoveNext([':']);
			var right = this.parseExpression();

			left = new ParserNode.ParserNodeTernaryOperation(left, middle, right);
		}
		return left;
	}

	parseTernaryShortcut() { return this._parseBinary('parseTernaryShortcut', this.parseLogicOr, ['?:']); }
	parseLogicOr() { return this._parseBinary('parseLogicOr', this.parseLogicAnd, ['||', 'or']); }
	parseLogicAnd() { return this._parseBinary('parseLogicAnd', this.parseBitOr, ['&&', 'and']); }
	parseBitOr() { return this._parseBinary('parseBitOr', this.parseBitXor, ['b-or']); }
	parseBitXor() { return this._parseBinary('parseBitXor', this.parseBitAnd, ['b-xor']); }
	parseBitAnd() { return this._parseBinary('parseBitAnd', this.parseCompare, ['b-and']); }
	parseCompare() { return this._parseBinary('parseCompare', this.parseAddSub, ['==', '!=', '>=', '<=', '>', '<', '===', '!==', 'is not', 'not in', 'is', 'in']); }
	parseAddSub() { return this._parseBinary('parseAddSub', this.parseMulDiv, ['+', '-']); }
	parseMulDiv() { return this._parseBinary('parseMulDiv', this.parsePow, ['*', '/', '//', '%']); }
	parsePow() { return this._parseBinary('parsePow', this.parseString, ['**']); }
	parseString() { return this._parseBinary('parseString', this.parseLiteralUnary, ['~', '..']); }

	parseLiteralUnary() {
		var token = this.tokenReader.peek();
		var expr: ParserNode.ParserNodeExpression = undefined;
	
		// '(' <expression> ')'
		if (this.tokenReader.checkAndMoveNext(['('])) {
			var subExpression = this.parseExpression();
			this.tokenReader.expectAndMoveNext([')']);
			expr = subExpression;
		}
		// '[' [<expression> [',']] ']'
		else if (this.tokenReader.checkAndMoveNext(['['])) {
			var arrayElements: ParserNode.ParserNodeExpression[] = [];
			while (true) {
				if (this.tokenReader.peek().value == ']') {
					this.tokenReader.skip();
					break;
				}
				arrayElements.push(this.parseExpression());
				if (this.tokenReader.peek().value == ']') {
					this.tokenReader.skip();
					break;
				} else if (this.tokenReader.peek().value == ',') {
					this.tokenReader.skip();
				}
			}
			expr = new ParserNode.ParserNodeArrayContainer(arrayElements);
		}
		// '{' [<key> ':' <expression> [',']] '}'
		else if (this.tokenReader.checkAndMoveNext(['{'])) {
			var objectElements: ParserNode.ParserNodeObjectItem[] = [];
			while (true) {
				if (this.tokenReader.peek().value == '}') {
					this.tokenReader.skip();
					break;
				}
				var key = this.parseExpression();
				this.tokenReader.expectAndMoveNext([':']);
				var value = this.parseExpression();
				objectElements.push(new ParserNode.ParserNodeObjectItem(key, value));

				if (this.tokenReader.peek().value == ']') {
					this.tokenReader.skip();
					break;
				} else if (this.tokenReader.peek().value == ',') {
					this.tokenReader.skip();
				}
			}
			expr = new ParserNode.ParserNodeObjectContainer(objectElements);
		}
		// Unary operator.
		else if (['-', '+', '~', '!', 'not'].indexOf(token.value) != -1) {
			this.tokenReader.skip();
			expr = new ParserNode.ParserNodeUnaryOperation(token.value, this.parseLiteralUnary());
		}
		// Numeric or string literal.
		else if (token.type == 'number' || token.type == 'string') {
			this.tokenReader.skip();

			expr = null;

			if (token.type == 'string' && token.rawValue.substr(0, 1) == '"') {
				var regexp = /\#\{[^\}]*\}/g;
				var parts2 = (<string>token.value).split(regexp);
				var matches = (<string>token.value).match(regexp);
				if (matches && parts2) {
					//console.log(token.value);
					//console.log(matches);
					for (var n = 0; n < parts2.length; n++) {
						var p1 = new ParserNode.ParserNodeLiteral(parts2[n]);
						if (expr == null) {
							expr = p1;
						} else {
							expr = new ParserNode.ParserNodeBinaryOperation('~', expr, p1);
						}
						if (n < matches.length) {
							var expressionString = matches[n].substr(2, matches[n].length - 2 - 1);
							expr = new ParserNode.ParserNodeBinaryOperation(
								'~',
								expr,
								new ExpressionParser(new TokenReader.TokenReader(new ExpressionTokenizer.ExpressionTokenizer(new StringReader.StringReader(expressionString))), this.tokenParserContext).parseExpression()
							);
						}
					}
					//console.log(parts);
					//console.log(matches);
				} 
			}

			if (expr == null) {
				expr = new ParserNode.ParserNodeLiteral(token.value);
			}
		}
		else {
			expr = this.parseIdentifier();
		}

		while (true)
		{
			// Function call
			if (this.tokenReader.peek().value == '(')
			{
				this.tokenReader.skip();
				var arguments;
				if (this.tokenReader.peek().value != ')') {
					arguments = this.parseCommaExpressionWithNames();
				} else {
					arguments = new ParserNode.ParserNodeCommaExpression([]);
				}
				this.tokenReader.expectAndMoveNext([')']);
				if (expr instanceof ParserNode.ParserNodeIdentifier) {
					var functionName = (<ParserNode.ParserNodeIdentifier>expr).value;

					if (this.tokenParserContext.common.sandbox) {
						if (this.tokenParserContext.sandboxPolicy.allowedFunctions.indexOf(functionName) == -1) throw (new Error("SandboxPolicy disallows function '" + functionName + "'"));
					}

					expr = new ParserNode.ParserNodeFunctionCall(new ParserNode.ParserNodeLiteral(functionName), arguments);
				} else {
					expr = new ParserNode.ParserNodeFunctionCall(expr, arguments);
				}
			}
			// Array access/slicing
			if (this.tokenReader.peek().value == '[') {
				this.tokenReader.skip();
				var parts = [];

				// Slicing without first expression
				if (this.tokenReader.peek().value == ':') {
					this.tokenReader.skip();
					parts.push(new ParserNode.ParserNodeLiteral(undefined));
				}

				parts.push(this.parseExpression());

				// Slicing with at least first expression
				if (this.tokenReader.peek().value == ':') {
					this.tokenReader.skip();
					if (parts.length != 1) throw (new Error("Unexpected ':' again"));
					if (this.tokenReader.peek().value == ']') {
						this.tokenReader.skip();
						parts.push(new ParserNode.ParserNodeLiteral(undefined));
					} else {
						parts.push(this.parseExpression());
						this.tokenReader.expectAndMoveNext([']']);
					}
				} else {
					this.tokenReader.expectAndMoveNext([']']);
				}

				if (parts.length == 1) {
					expr = new ParserNode.ParserNodeArrayAccess(expr, parts[0]);
				} else {
					expr = new ParserNode.ParserNodeArraySlice(expr, parts[0], parts[1]);
				}
			}
			// Field access
			if (this.tokenReader.peek().value == '.') {
				this.tokenReader.skip();
				var fieldName = this.tokenReader.peek().value;
				this.tokenReader.skip();
				expr = new ParserNode.ParserNodeArrayAccess(expr, new ParserNode.ParserNodeLiteral(fieldName));
			}
			// Filter
			else if (this.tokenReader.peek().value == '|') {
				this.tokenReader.skip();
				var filterName = this.tokenReader.peek().value;
				this.tokenReader.skip();

				var arguments = new ParserNode.ParserNodeCommaExpression([]);

				if (this.tokenReader.peek().value == '(') {
					this.tokenReader.skip();
					if (this.tokenReader.peek().value != ')') {
						arguments = this.parseCommaExpression();
					}
					this.tokenReader.expectAndMoveNext([')']);
				}

				arguments.expressions.unshift(expr);

				if (this.tokenParserContext.common.sandbox) {
					if (this.tokenParserContext.sandboxPolicy.allowedFilters.indexOf(filterName) == -1) throw (new Error("SandboxPolicy disallows filter '" + filterName + "'"));
				}
				expr = new ParserNode.ParserNodeFilterCall(filterName, arguments);
			}
				// End or other
			else {
				return expr;
			}
		}
	}

	parseStringLiteral(): ParserNode.ParserNodeLiteral {
		var token = this.tokenReader.peek();

		if (token.type == 'string') {
			this.tokenReader.skip();
			return new ParserNode.ParserNodeLiteral(token.value);
		}

		throw (new Error("Unexpected token : " + JSON.stringify(token.value) + " type:'" + token.type + "'"));
	}

	parseIdentifierCommaList(): ParserNode.ParserNodeExpression[]{
		var identifiers = <ParserNode.ParserNodeExpression[]>[];
		while (true) {
			identifiers.push(this.parseIdentifier());
			if (this.tokenReader.checkAndMoveNext([',']) === undefined) break;
		}
		return identifiers;
	}

	parseIdentifierOnly() {
		var token = this.tokenReader.peek();

		if (token.type == 'id') {
			this.tokenReader.skip();
			var identifierString = token.value;

			return new ParserNode.ParserNodeIdentifier(identifierString);
		}

		throw (new Error("Unexpected token : " + JSON.stringify(token.value) + " type:'" + token.type + "'"));
	}

	parseIdentifier(): ParserNode.ParserNodeExpression {
		var token = this.tokenReader.peek();

		if (token.type == 'id') {
			this.tokenReader.skip();
			var identifierString = token.value;

			switch (identifierString) {
				case 'false': return new ParserNode.ParserNodeLiteral(false);
				case 'true': return new ParserNode.ParserNodeLiteral(true);
				case 'null': return new ParserNode.ParserNodeLiteral(null);
				case 'undefined': return new ParserNode.ParserNodeLiteral(undefined);
				default: return new ParserNode.ParserNodeIdentifier(identifierString);
			}
		}
	
		throw(new Error("Unexpected token : " + JSON.stringify(token.value) + " type:'" + token.type + "'"));
	}

	_parseBinary(levelName: string, nextParseLevel: () => void, validOperators: string[]) {
		var leftNode = nextParseLevel.apply(this);
		var rightNode;
		var currentOperator;

		//console.log(this.tokenReader);
		//console.log(this.tokenReader.hasMore());

		while (this.tokenReader.hasMore()) {
			if ((currentOperator = this.tokenReader.checkAndMoveNextMultiToken(validOperators)) === undefined) break;

			rightNode = nextParseLevel.apply(this);
			leftNode = new ParserNode.ParserNodeBinaryOperation(currentOperator, leftNode, rightNode);
		}

		return leftNode;
	}
}
