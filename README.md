![Travis (.com)](https://img.shields.io/travis/com/tmorell/tslint-rules)
![David (path)](https://img.shields.io/david/tmorell/tslint-checks)
![Snyk Vulnerabilities for npm scoped package](https://img.shields.io/snyk/vulnerabilities/npm/tslint-checks)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=tmorell_tslint-checks&metric=alert_status)](https://sonarcloud.io/dashboard?id=tmorell_tslint-checks)

<div>

![npm](https://img.shields.io/npm/v/tslint-checks)
![NPM](https://img.shields.io/npm/l/tslint-checks)

</div>


# TSLint Checks
A set of additional rules for TSLint.

# Installation

```
npm install --save-dev tslint-checks
```

# Configuration

Add `node_modules/tslint-checks` under `rulesDirectory` entry in `tslint.json`:

```
    "rulesDirectory": [
        "node_modules/tslint-checks"
    ],
    "rules": {
        ...
    }

```

# Rules
The following rules are available:

<table>
    <thead>
        <th>Rule name</th>
        <th>Description</th>
    </thead>
    <tbody>
        <tr>
            <td style="vertical-align:top;min-width:130px">no-focused-tests</td>
            <td>
                Do not commit code with focused tests. This is useful during development, but it might hide failing tests that do not get executed. Configuration:<br />
                <b>runner</b>: Select one of the available options, ava, jasmine, jest, or mocha.<br />
                <b>suffix</b>: Suffix for the test files; if not specified, all files will be analyzed.<br /><br />
                Example:<br />
                <pre>
                "no-focused-tests": [
                    true,
                    {
                        "runner": "ava",
                        "suffix": ".spec.ts"
                    }
                ]
                </pre>
            </td>
        </tr>
    </tbody>
</table>

# License
MIT
