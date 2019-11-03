import * as ts from "typescript";
import * as Lint from "tslint";
import * as tsutils from "tsutils";

const RUNNER_AVA = "ava";
const RUNNER_JASMINE = "jasmine";
const RUNNER_JEST = "jest";
const RUNNER_MOCHA = "mocha";

interface Options {
    runner: "ava" | "jasmine" | "jest" | "mocha";
    suffix: string;
    checks: Array<string>;
}

export class Rule extends Lint.Rules.AbstractRule {
    public static FAILURE_FOCUSED = "Do not commit focused tests.";
    public static FAILURE_FDESCRIBE = "Favor '.only' over 'fdescribe'.";
    public static FAILURE_FIT = "Favor '.only' over 'fit'.";
    public static metadata: Lint.IRuleMetadata = {
        description: "Ensures that no tests are missed.",
        options: {
            type: "string",
            enum: [RUNNER_AVA, RUNNER_JASMINE, RUNNER_JEST, RUNNER_MOCHA]
        },
        optionExamples: [[true, RUNNER_AVA], [true, RUNNER_JASMINE], [true, RUNNER_JEST], [true, RUNNER_MOCHA]],
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

        let walker: (ctx: Lint.WalkContext<Options>) => void;
        switch (options.runner) {
            case RUNNER_AVA:
                options.checks = ["test.only", "test.serial.only"];
                walker = walkTwoArgs;
                break;
            case RUNNER_JASMINE:
                options.checks = ["fdescribe", "fit"];
                walker = walkOneArg;
                break;
            case RUNNER_MOCHA:
                options.checks = ["describe.only", "it.only", "specify.only", "context.only"];
                walker = walkTwoArgs;
                break;
            case RUNNER_JEST:
                options.checks = ["describe.only", "describe.only.each", "it.only"];
                walker = walkTwoArgs;
                break;
            default:
                // TODO: Handle configuration error
                return new Array<Lint.RuleFailure>();
        }

        if (!possibleMatches(sourceFile, options)) {
            return new Array<Lint.RuleFailure>();
        }

        return this.applyWithFunction(sourceFile, walker, options);
    }
}

function walkOneArg(ctx: Lint.WalkContext<Options>): void {
    const walkNode = (node: ts.Node): void => {
        if (tsutils.isCallExpression(node) &&
            node.arguments.length === 1 &&
            tsutils.isIdentifier(node.expression) &&
            ctx.options.checks.includes(node.expression.getText())
        ) {
            ctx.addFailureAtNode(node, Rule.FAILURE_FOCUSED);
        }
        ts.forEachChild(node, walkNode);
    };
    ts.forEachChild(ctx.sourceFile, walkNode);
}

function walkTwoArgs(ctx: Lint.WalkContext<Options>): void {
    const walkNode = (node: ts.Node): void => {
        if (tsutils.isCallExpression(node)) {
            const text = node.expression.getText();
            if (text === "fdescribe") {
                ctx.addFailureAtNode(node, Rule.FAILURE_FDESCRIBE);
            } else if (text === "fit") {
                ctx.addFailureAtNode(node, Rule.FAILURE_FIT);
            } else if (ctx.options.runner === RUNNER_JEST && isJestTable(node)) {
                ctx.addFailureAtNode(node, Rule.FAILURE_FOCUSED);
            } else if (
                tsutils.isPropertyAccessExpression(node.expression) &&
                node.arguments.length === 2 &&
                (tsutils.isStringLiteral(node.arguments[0]) || tsutils.isTemplateLiteral(node.arguments[0])) &&
                (tsutils.isFunctionExpression(node.arguments[1]) || tsutils.isArrowFunction(node.arguments[1])) &&
                ctx.options.checks.includes(text)
            ) {
                ctx.addFailureAtNode(node, Rule.FAILURE_FOCUSED);
            }
        }
        ts.forEachChild(node, walkNode);
    };
    ts.forEachChild(ctx.sourceFile, walkNode);
}

function isJestTable(node: ts.CallExpression): boolean {
    return node.expression.getText() === "describe.only.each" &&
        node.arguments.length === 1 &&
        tsutils.isArrayLiteralExpression(node.arguments[0])
        ;
}

function possibleMatches(sourceFile: ts.SourceFile, options: Options): boolean {
    const text = sourceFile.getFullText();
    return (options.checks.some((check) => text.indexOf(check) > -1));
}
