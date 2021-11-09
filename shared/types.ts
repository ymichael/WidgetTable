export enum FieldType {
  TEXT_SINGLE_LINE = "TEXT_SINGLE_LINE",
  TEXT_MULTI_LINE = "TEXT_MULTI_LINE",
  CHECKBOX = "CHECKBOX",
  SELECT_SINGLE = "SELECT_SINGLE",
  SELECT_MULTIPLE = "SELECT_MULTIPLE",
  URL = "URL",
}

export type TableField =
  | {
      fieldName: string;
      fieldType:
        | FieldType.TEXT_SINGLE_LINE
        | FieldType.TEXT_MULTI_LINE
        | FieldType.CHECKBOX
        | FieldType.URL;
    }
  | {
      fieldName: string;
      fieldType: FieldType.SELECT_SINGLE | FieldType.SELECT_MULTIPLE;
      fieldOptions: string[];
    };

export type Table = {
  name: string;
  fields: TableField[];
};

export type TRow = {
  rowId: string;
  rowData: { [key: string]: any };
};

export type WidgetToIFrameMessage =
  | {
      type: "EDIT_SCHEMA";
      table: Table;
    }
  | {
      type: "NEW_ROW";
      table: Table;
    }
  | {
      type: "EDIT_ROW";
      table: Table;
      row: TRow;
    };

export type IFrameToWidgetMessage =
  | {
      type: "RESIZE";
      width: number;
      height: number;
    }
  | {
      type: "UPDATE_SCHEMA";
      table: Table;
    }
  | {
      type: "EDIT_ROW";
      row: TRow;
    }
  | {
      type: "NEW_ROW";
      row: Pick<TRow, "rowData">;
    };
