import { TRow, TableField, FieldType } from "../shared/types";

export type Template = {
  title: string;
  description: string;
  defaultSchema: TableField[];
  defaultRows: TRow["rowData"][];
};

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

export const TEMPLATES: Template[] = [
  {
    title: "Task Management",
    description: "Tasks, priorities and completion status",
    defaultSchema: [],
    defaultRows: [],
  },
  {
    title: "Poll / Voting",
    description: "Collect +1s on each row, great for Q&A and ad-hoc polls",
    defaultSchema: [],
    defaultRows: [],
  },
  {
    title: "Inventory List",
    description: "Item, description, quanty & price",
    defaultSchema: [],
    defaultRows: [],
  },
  {
    title: "CRM",
    description: "Contact name, pronouns, company, email & notes",
    defaultSchema: [],
    defaultRows: [],
  },
];
