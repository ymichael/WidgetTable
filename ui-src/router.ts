import { TRow, Table, WidgetToIFrameShowUIMessage } from "../shared/types";
import { TEST_TABLE, testTableRows } from "./constants";

export enum RouteType {
  SCHEMA_EDITOR,
  ROW_EDITOR,
  FULL_TABLE,
}

export type AppRoute = { table: Table } & (
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
          table: widgetPayload.table,
          rows: widgetPayload.rows,
        };
      case "EDIT_SCHEMA":
        return {
          type: RouteType.SCHEMA_EDITOR,
          table: widgetPayload.table,
        };
      case "NEW_ROW":
        return {
          type: RouteType.ROW_EDITOR,
          table: widgetPayload.table,
          isEdit: false,
        };
      case "EDIT_ROW":
        return {
          type: RouteType.ROW_EDITOR,
          table: widgetPayload.table,
          isEdit: true,
          row: widgetPayload.row,
        };
    }
  } else {
    if (/schema=1/.test(window.location.search)) {
      return {
        type: RouteType.SCHEMA_EDITOR,
        table: TEST_TABLE,
      };
    }
    if (/editor=1/.test(window.location.search)) {
      return {
        type: RouteType.ROW_EDITOR,
        table: TEST_TABLE,
        isEdit: false,
      };
    }
  }
  return {
    type: RouteType.FULL_TABLE,
    table: TEST_TABLE,
    rows: testTableRows(),
  };
}
