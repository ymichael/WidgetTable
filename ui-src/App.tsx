import * as React from "react";
import styles from "./App.module.css";

import { TEST_TABLE_SCHEMA, TEST_TABLE_ROWS } from "./constants";
import SchemaEditor from "./SchemaEditor";
import RowEditor from "./RowEditor";
import TableNameEditor from "./TableNameEditor";
import Table from "./Table";

import {
  TableField,
  TRow,
  WidgetToIFrameMessage,
  IFrameToWidgetMessage,
} from "../shared/types";
import { assertUnreachable } from "../shared/utils";

enum RouteType {
  SCHEMA_EDITOR,
  ROW_EDITOR,
  TITLE_EDITOR,
  FULL_TABLE,
}

type AppRoute =
  | {
      type: RouteType.SCHEMA_EDITOR;
      tableSchema: TableField[];
    }
  | {
      type: RouteType.ROW_EDITOR;
      isEdit: true;
      tableSchema: TableField[];
      row: TRow;
    }
  | {
      type: RouteType.ROW_EDITOR;
      isEdit: false;
      tableSchema: TableField[];
    }
  | {
      type: RouteType.TITLE_EDITOR;
      title: string;
    }
  | {
      type: RouteType.FULL_TABLE;
      title: string;
      tableSchema: TableField[];
      rows: TRow[];
    };

const widgetPayload: WidgetToIFrameMessage | undefined = (window as any)
  .widgetPayload;

function getAppRoute(): AppRoute {
  if (widgetPayload) {
    switch (widgetPayload.type) {
      case "FULL_TABLE":
        return {
          type: RouteType.FULL_TABLE,
          tableSchema: widgetPayload.fields,
          title: widgetPayload.name,
          rows: widgetPayload.rows,
        };
      case "EDIT_SCHEMA":
        return {
          type: RouteType.SCHEMA_EDITOR,
          tableSchema: widgetPayload.fields,
        };
      case "NEW_ROW":
        return {
          type: RouteType.ROW_EDITOR,
          isEdit: false,
          tableSchema: widgetPayload.fields,
        };
      case "EDIT_ROW":
        return {
          type: RouteType.ROW_EDITOR,
          isEdit: true,
          tableSchema: widgetPayload.fields,
          row: widgetPayload.row,
        };
      case "RENAME_TABLE":
        return {
          type: RouteType.TITLE_EDITOR,
          title: widgetPayload.name,
        };
    }
  } else {
    if (/schema=1/.test(window.location.search)) {
      return {
        type: RouteType.SCHEMA_EDITOR,
        tableSchema: TEST_TABLE_SCHEMA,
      };
    }
    if (/editor=1/.test(window.location.search)) {
      return {
        type: RouteType.ROW_EDITOR,
        tableSchema: TEST_TABLE_SCHEMA,
        isEdit: false,
      };
    }
    if (/title=1/.test(window.location.search)) {
      return {
        type: RouteType.TITLE_EDITOR,
        title: "Test Table",
      };
    }
  }
  return {
    type: RouteType.FULL_TABLE,
    title: "Test Table",
    tableSchema: TEST_TABLE_SCHEMA,
    rows: TEST_TABLE_ROWS,
  };
}

function Route({ route }: { route: AppRoute }) {
  switch (route.type) {
    case RouteType.SCHEMA_EDITOR:
      return (
        <SchemaEditor
          initialValues={{ fields: route.tableSchema }}
          onSubmit={(v, closeIframe) => {
            if (widgetPayload) {
              const payload: IFrameToWidgetMessage = {
                type: "UPDATE_SCHEMA",
                closeIframe,
                fields: v.fields,
              };
              parent?.postMessage({ pluginMessage: payload }, "*");
            } else {
              console.log({ schema: v, closeIframe });
            }
          }}
        />
      );
    case RouteType.ROW_EDITOR:
      return (
        <RowEditor
          tableSchema={route.tableSchema}
          initialValues={route.isEdit ? route.row.rowData : {}}
          isEdit={route.isEdit}
          onEdit={(v, closeIframe) => {
            if (widgetPayload && route.isEdit) {
              const payload: IFrameToWidgetMessage = {
                type: "EDIT_ROW",
                closeIframe,
                row: {
                  rowId: route.row.rowId,
                  rowData: v,
                },
              };
              parent?.postMessage({ pluginMessage: payload }, "*");
            } else {
              console.log({ onEdit: v, closeIframe });
            }
          }}
          onDelete={() => {
            if (widgetPayload && route.isEdit) {
              const payload: IFrameToWidgetMessage = {
                type: "DELETE_ROW",
                row: {
                  rowId: route.row.rowId,
                },
              };
              parent?.postMessage({ pluginMessage: payload }, "*");
            } else {
              console.log("onDelete");
            }
          }}
          onCreate={(v, closeIframe) => {
            if (!!widgetPayload) {
              const payload: IFrameToWidgetMessage = {
                type: "NEW_ROW",
                closeIframe,
                row: { rowData: v },
              };
              parent?.postMessage({ pluginMessage: payload }, "*");
            } else {
              console.log({ onCreate: v, closeIframe });
            }
          }}
        />
      );
    case RouteType.TITLE_EDITOR:
      return (
        <TableNameEditor
          name={route.title}
          onSubmit={({ name }, closeIframe) => {
            if (!!widgetPayload) {
              const payload: IFrameToWidgetMessage = {
                type: "RENAME_TABLE",
                closeIframe,
                name,
              };
              parent?.postMessage({ pluginMessage: payload }, "*");
            } else {
              console.log({ name, closeIframe });
            }
          }}
        />
      );
    case RouteType.FULL_TABLE:
      return (
        <Table
          title={route.title}
          tableSchema={route.tableSchema}
          rows={route.rows}
        />
      );
    default:
      assertUnreachable(route);
  }
}

function App() {
  const appRoute = getAppRoute();
  return (
    <div className={styles.App}>
      <Route route={appRoute} />
    </div>
  );
}

export default App;
