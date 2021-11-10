import { FieldType } from "../shared/types";

export const FIELD_TYPE_READABLE: Record<FieldType, string> = {
  TEXT_SINGLE_LINE: "Single line text",
  TEXT_MULTI_LINE: "Multi-line text",
  URL: "URL",
  EMAIL: "Email",
  NUMBER: "Number",
  CHECKBOX: "Checkbox",
  SELECT_SINGLE: "Single select",
  SELECT_MULTIPLE: "Multi select",
};

export const FIELD_TYPE_DESCRIPTION: Record<FieldType, string> = {
  TEXT_SINGLE_LINE:
    "Single line text is best for short text that fits on a single line. Eg. names ",
  TEXT_MULTI_LINE:
    "Multi-line text is ideal for long form text that spans multiple lines.",
  NUMBER:
    "The number field is useful if you intend to store a numerical value.",
  URL: "The URL field can be used if you intend to store a single URL in this field. When displayed, the field will link directly to the specified value.",
  EMAIL:
    "The email field is useful if you intend to store a single email address in this field.",
  CHECKBOX: "The checkbox field type is useful for true / false values.",
  SELECT_SINGLE:
    "The single select field type is ideal when you want to ensure that one of a preset list of options is chosen.",
  SELECT_MULTIPLE:
    "The multi select field is similar to the single select field but allows for multiple options to be chosen.",
};
