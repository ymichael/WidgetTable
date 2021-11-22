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

export type WidgetToIFramePostMessage =
  | {
      type: "UPDATE_ROWS";
      rows: TRow[];
    }
  | {
      type: "UPDATE_SCHEMA";
      fields: TableField[];
    }
  | {
      type: "UPDATE_TITLE";
      title: string;
    };

export type WidgetToIFrameShowUIMessage = {
  fields: TableField[];
  title: string;
  themeName: string;
} & (
  | {
      type: "EDIT_SCHEMA";
    }
  | {
      type: "FULL_TABLE";
      rows: TRow[];
    }
  | {
      type: "NEW_ROW";
    }
  | {
      type: "EDIT_ROW";
      row: TRow;
    }
);

export type IFrameToWidgetMessage =
  | {
      type: "RESIZE";
      payloadType: WidgetToIFrameShowUIMessage["type"];
      width: number;
      height: number;
    }
  | {
      type: "UPDATE_SCHEMA";
      closeIframe: boolean;
      fields: TableField[];
    }
  | {
      type: "UPSERT_ROW";
      closeIframe: boolean;
      row: TRow;
    }
  | {
      type: "REORDER_ROW";
      rowId: TRow["rowId"];
      newRowId: TRow["rowId"];
    }
  | {
      type: "NEW_ROW";
      closeIframe: boolean;
      row: Pick<TRow, "rowData">;
    }
  | {
      type: "DELETE_ROW";
      closeIframe: boolean;
      row: Pick<TRow, "rowId">;
    }
  | {
      type: "RENAME_TABLE";
      closeIframe: boolean;
      name: string;
    };
