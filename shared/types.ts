export enum FieldType {
  TEXT_SINGLE_LINE = "TEXT_SINGLE_LINE",
  TEXT_MULTI_LINE = "TEXT_MULTI_LINE",
  CHECKBOX = "CHECKBOX",
  SELECT_SINGLE = "SELECT_SINGLE",
  SELECT_MULTIPLE = "SELECT_MULTIPLE",
  URL = "URL",
  EMAIL = "EMAIL",
  NUMBER = "NUMBER",
  VOTE = "VOTE",
}

export type TableField =
  | {
      fieldId: string;
      fieldName: string;
      fieldType:
        | FieldType.TEXT_SINGLE_LINE
        | FieldType.TEXT_MULTI_LINE
        | FieldType.CHECKBOX
        | FieldType.URL
        | FieldType.EMAIL
        | FieldType.VOTE;
    }
  | {
      fieldId: string;
      fieldName: string;
      fieldType: FieldType.NUMBER;
      fieldPrefix: string;
      fieldSuffix: string;
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

export type WidgetToIFrameMessage = { fields: TableField[] } & (
  | {
      type: "EDIT_SCHEMA";
    }
  | {
      type: "FULL_TABLE";
      name: string;
      rows: TRow[];
    }
  | {
      type: "NEW_ROW";
    }
  | {
      type: "EDIT_ROW";
      row: TRow;
    }
  | {
      type: "RENAME_TABLE";
      name: string;
    }
);

export type IFrameToWidgetMessage =
  | {
      type: "RESIZE";
      width: number;
      height: number;
    }
  | {
      type: "UPDATE_SCHEMA";
      closeIframe: boolean;
      fields: TableField[];
    }
  | {
      type: "EDIT_ROW";
      closeIframe: boolean;
      row: TRow;
    }
  | {
      type: "NEW_ROW";
      closeIframe: boolean;
      row: Pick<TRow, "rowData">;
    }
  | {
      type: "DELETE_ROW";
      row: Pick<TRow, "rowId">;
    }
  | {
      type: "RENAME_TABLE";
      closeIframe: boolean;
      name: string;
    };
