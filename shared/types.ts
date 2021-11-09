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
      fieldId: string;
      fieldName: string;
      fieldType:
        | FieldType.TEXT_SINGLE_LINE
        | FieldType.TEXT_MULTI_LINE
        | FieldType.CHECKBOX
        | FieldType.URL;
    }
  | {
      fieldId: string;
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
      fields: TableField[];
    }
  | {
      type: "NEW_ROW";
      fields: TableField[];
    }
  | {
      type: "EDIT_ROW";
      fields: TableField[];
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
      fields: TableField[];
    }
  | {
      type: "EDIT_ROW";
      row: TRow;
    }
  | {
      type: "NEW_ROW";
      fromEdit: boolean;
      row: Pick<TRow, "rowData">;
    }
  | {
      type: "DELETE_ROW";
      row: Pick<TRow, "rowId">;
    };
