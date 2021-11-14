import { TRow, TableField, WidgetToIFrameShowUIMessage } from "../shared/types";
import { TEST_TABLE_SCHEMA, TEST_TABLE_ROWS } from "./constants";

export enum RouteType {
  SCHEMA_EDITOR,
  ROW_EDITOR,
  TITLE_EDITOR,
  FULL_TABLE,
}

export type AppRoute =
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
      tableSchema: TableField[];
      title: string;
    }
  | {
      type: RouteType.FULL_TABLE;
      title: string;
      tableSchema: TableField[];
      rows: TRow[];
    };

const widgetPayload: WidgetToIFrameShowUIMessage | undefined = (window as any)
  .widgetPayload;

export function getAppRoute(): AppRoute {
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
          tableSchema: [],
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
        tableSchema: TEST_TABLE_SCHEMA,
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
