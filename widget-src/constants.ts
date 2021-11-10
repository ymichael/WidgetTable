import { TableField, FieldType } from "../shared/types";

export const DEFAULT_SCHEMA: TableField[] = [
  {
    fieldId: "title",
    fieldName: "Title",
    fieldType: FieldType.TEXT_SINGLE_LINE,
  },
  {
    fieldId: "desc",
    fieldName: "Description",
    fieldType: FieldType.TEXT_MULTI_LINE,
  },
  {
    fieldId: "completed",
    fieldName: "Completed",
    fieldType: FieldType.CHECKBOX,
  },
];

export const STICKY_SCHEMA: TableField[] = [
  {
    fieldId: "text",
    fieldName: "Sticky Text",
    fieldType: FieldType.TEXT_MULTI_LINE,
  },
  {
    fieldId: "author",
    fieldName: "Author",
    fieldType: FieldType.TEXT_SINGLE_LINE,
  },
];

export const STICKY_NO_AUTHOR_SCHEMA: TableField[] = [
  {
    fieldId: "text",
    fieldName: "Sticky Text",
    fieldType: FieldType.TEXT_MULTI_LINE,
  },
];
