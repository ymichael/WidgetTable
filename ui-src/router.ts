import { TRow, TableField, WidgetToIFrameShowUIMessage } from "../shared/types";
import { TEST_TABLE_SCHEMA, testTableRows } from "./constants";

export enum RouteType {
  SCHEMA_EDITOR,
  ROW_EDITOR,
  FULL_TABLE,
}

export type AppRoute = { title: string; tableSchema: TableField[] } & (
  | {
      type: RouteType.SCHEMA_EDITOR;
    }
  | {
      type: RouteType.ROW_EDITOR;
      isEdit: true;
      row: TRow;
    }
  | {
      type: RouteType.ROW_EDITOR;
      isEdit: false;
    }
  | {
      type: RouteType.FULL_TABLE;
      rows: TRow[];
    }
);

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
  }
  return {
    type: RouteType.FULL_TABLE,
    title: "Test Table",
    tableSchema: TEST_TABLE_SCHEMA,
    rows: testTableRows(),
  };
}
