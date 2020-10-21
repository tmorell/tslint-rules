import * as ts from "typescript";
import * as Lint from "tslint";
import * as tsutils from "tsutils";

const RUNNER_AVA = "ava";
const RUNNER_JASMINE = "jasmine";
const RUNNER_JEST = "jest";
const RUNNER_MOCHA = "mocha";
const validators = {
    ava: validatorAva,
    jasmine: validatorJasmine,
    jest: validatorJest,
    mocha: validatorMocha
};

interface Options {
    runner: "ava" | "jasmine" | "jest" | "mocha";
    suffix: string;
    validator: (node: ts.CallExpression) => boolean;
}

export class Rule extends Lint.Rules.AbstractRule {
    public static FAILURE_FOCUSED = "Do not commit focused tests.";
    public static metadata: Lint.IRuleMetadata = {
        description: Rule.FAILURE_FOCUSED,
        options: { type: "string", enum: [RUNNER_AVA, RUNNER_JASMINE, RUNNER_JEST, RUNNER_MOCHA] },
        optionExamples: [[true, { runner: RUNNER_AVA }], [true, { runner: RUNNER_JASMINE }],
        [true, { runner: RUNNER_JEST }], [true, { runner: RUNNER_MOCHA }]],
        optionsDescription: Lint.Utils.dedent`
            Options:
            * \`"${RUNNER_AVA}"\` checks for AVA focused tests.
            * \`"${RUNNER_JASMINE}"\` checks for Jasmine focused tests.
            * \`"${RUNNER_JEST}"\` checks for Jest focused tests.
            * \`"${RUNNER_MOCHA}"\` checks for Mocha focused tests.
        `,
        ruleName: "no-focused-tests",
        type: "maintainability",
        typescriptOnly: true,
        hasFix: false
    };

    public apply(sourceFile: ts.SourceFile): Array<Lint.RuleFailure> {
        const options = this.ruleArguments[0] as Options;
        if (options.suffix && !sourceFile.fileName.endsWith(options.suffix)) {
            return new Array<Lint.RuleFailure>();
        }
        options.validator = validators[options.runner];

        return this.applyWithFunction(sourceFile, walk, options);
    }
}

function walk(ctx: Lint.WalkContext<Options>): void {
    const walkNode = (node: ts.Node): void => {
        if (tsutils.isCallExpression(node)) {
            if (ctx.options.validator(node)) {
                ctx.addFailureAtNode(node, Rule.FAILURE_FOCUSED);
            }
        }
        ts.forEachChild(node, walkNode);
    };
    ts.forEachChild(ctx.sourceFile, walkNode);
}

function validatorAva(node: ts.CallExpression): boolean {
    return validatorOnly(node, ["test.only", "test.serial.only"]);
}

function validatorJasmine(node: ts.CallExpression): boolean {
    return ["fdescribe", "fit"].includes(node.expression.getText()) &&
        tsutils.isCallExpression(node) &&
        node.arguments.length === 1 &&
        (tsutils.isArrowFunction(node.arguments[0]) || tsutils.isFunctionExpression(node.arguments[0])) &&
        tsutils.isIdentifier(node.expression);
}

function validatorJest(node: ts.CallExpression): boolean {
    // Check Jest tables
    if (["describe.only.each"].includes(node.expression.getText()) &&
        node.arguments.length === 1 &&
        tsutils.isArrayLiteralExpression(node.arguments[0])) {
        return true;
    }

    // Check without .only accessor; fdescription, fit
    if (validatorTest(node, ["fdescribe", "fit"])) {
        return true;
    }

    // Check with .only accessor
    return validatorOnly(node, ["describe.only", "it.only", "specify.only", "context.only", "test.only"]);
}

function validatorMocha(node: ts.CallExpression): boolean {
    return validatorOnly(node, ["describe.only", "it.only", "specify.only", "context.only"]);
}

/**
 * Validates tests of form:
 *      expression.only("string literal", () => { });
 *      expression.only(`template literal`, () => { });
 * With .only accessor.
 *
 * @param {ts.CallExpression} node
 * @param {Array<string>} expressions
 * @returns {boolean}
 */
function validatorOnly(node: ts.CallExpression, expressions: Array<string>): boolean {
    return tsutils.isPropertyAccessExpression(node.expression) &&
        validatorTest(node, expressions);
}

/**
 * Validates tests of form:
 *      expression("string literal", () => { });
 *      expression(`template literal`, () => { });
 * With or without .only accessor.
 *
 * @param {ts.CallExpression} node
 * @param {Array<string>} expressions
 * @returns {boolean}
 */
function validatorTest(node: ts.CallExpression, expressions: Array<string>): boolean {
    return expressions.includes(node.expression.getText()) &&
        node.arguments.length === 2 &&
        (tsutils.isStringLiteral(node.arguments[0]) || tsutils.isTemplateLiteral(node.arguments[0])) &&
        (tsutils.isArrowFunction(node.arguments[1]) || tsutils.isFunctionExpression(node.arguments[1]));
}
