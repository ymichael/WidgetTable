import { TRow, TableField, WidgetToIFrameShowUIMessage } from "../shared/types";
import { TEST_TABLE_SCHEMA, testTableRows } from "./constants";

export enum RouteType {
  SCHEMA_EDITOR,
  ROW_EDITOR,
  TITLE_EDITOR,
  FULL_TABLE,
}

export type AppRoute =
  | {
      type: RouteType.SCHEMA_EDITOR;
      title: string;
      tableSchema: TableField[];
    }
  | {
      type: RouteType.ROW_EDITOR;
      title: string;
      isEdit: true;
      tableSchema: TableField[];
      row: TRow;
    }
  | {
      type: RouteType.ROW_EDITOR;
      title: string;
      isEdit: false;
      tableSchema: TableField[];
    }
  | {
      type: RouteType.TITLE_EDITOR;
      title: string;
      tableSchema: TableField[];
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
          title: widgetPayload.title,
          rows: widgetPayload.rows,
        };
      case "EDIT_SCHEMA":
        return {
          type: RouteType.SCHEMA_EDITOR,
          title: widgetPayload.title,
          tableSchema: widgetPayload.fields,
        };
      case "NEW_ROW":
        return {
          type: RouteType.ROW_EDITOR,
          isEdit: false,
          title: widgetPayload.title,
          tableSchema: widgetPayload.fields,
        };
      case "EDIT_ROW":
        return {
          type: RouteType.ROW_EDITOR,
          isEdit: true,
          tableSchema: widgetPayload.fields,
          title: widgetPayload.title,
          row: widgetPayload.row,
        };
    }
  } else {
    if (/schema=1/.test(window.location.search)) {
      return {
        type: RouteType.SCHEMA_EDITOR,
        tableSchema: TEST_TABLE_SCHEMA,
        title: "Test Table",
      };
    }
    if (/editor=1/.test(window.location.search)) {
      return {
        type: RouteType.ROW_EDITOR,
        tableSchema: TEST_TABLE_SCHEMA,
        title: "Test Table",
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
    rows: testTableRows(),
  };
}
