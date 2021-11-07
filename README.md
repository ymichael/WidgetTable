# WidgetTable

## Code organization:

| dir / path           | description                          |
| -------------------- | ------------------------------------ |
| ui-src/              | This is where the iframe code lives  |
| ui-src/index.html    | Main entry point for the iframe code |
| ui-src/tsconfig.json | tsconfig for the iframe code         |
| code.tsx             | This is the widget code              |
| tsconfig.json        | tsconfig for the widget code         |
| dist/                | Built output goes here               |

## Scripts

| script                   | description                                                             |
| ------------------------ | ----------------------------------------------------------------------- |
| npm run build            | one-off full build of both the iframe and widget                        |
| npm run build:main       | one-off build of the widget code                                        |
| npm run build:ui         | one-off build of the iframe code                                        |
| npm run build:main:watch | watch-mode build of the widget code. rebuilds if when you save changes. |
| npm run build:ui:watch   | watch-mode build of the iframe code. rebuilds if when you save changes. |
