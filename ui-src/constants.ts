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

export const FIELD_TYPE_READABLE: Record<FieldType, string> = {
  TEXT_SINGLE_LINE: "Single line text",
  TEXT_MULTI_LINE: "Multi-line text",
  URL: "URL",
  CHECKBOX: "Checkbox",
  SELECT_SINGLE: "Single select",
  SELECT_MULTIPLE: "Multi select",
};

export const FIELD_TYPE_DESCRIPTION: Record<FieldType, string> = {
  TEXT_SINGLE_LINE:
    "Single line text is best for short text that fits on a single line. Eg. names ",
  TEXT_MULTI_LINE:
    "Multi-line text is ideal for long form text that spans multiple lines.",
  URL: "The URL field can be used if you intend to store a single URL in this field. When displayed, the field will link directly to the specified value.",
  CHECKBOX: "The checkbox field type is useful for true / false values.",
  SELECT_SINGLE:
    "The single select field type is ideal when you want to ensure that one of a preset list of options is chosen.",
  SELECT_MULTIPLE:
    "The multi select field is similar to the single select field but allows for multiple options to be chosen.",
};
