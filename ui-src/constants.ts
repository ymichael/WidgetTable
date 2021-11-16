import { TRow, Table, FieldType } from "../shared/types";
import fractionalIndex from "../shared/fractional-indexing";

export const FIELD_TYPE_READABLE: Record<FieldType, string> = {
  TEXT_SINGLE_LINE: "Single line text",
  TEXT_MULTI_LINE: "Multi-line text",
  URL: "URL",
  EMAIL: "Email",
  NUMBER: "Number",
  CHECKBOX: "Checkbox",
  VOTE: "Vote",
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
  VOTE: "The vote field is useful to enable to voting on rows. Every user is allowed to vote once.",
  EMAIL:
    "The email field is useful if you intend to store a single email address in this field.",
  CHECKBOX: "The checkbox field type is useful for true / false values.",
  SELECT_SINGLE:
    "The single select field type is ideal when you want to ensure that one of a preset list of options is chosen.",
  SELECT_MULTIPLE:
    "The multi select field is similar to the single select field but allows for multiple options to be chosen.",
};

export const TEST_TABLE_SCHEMA: Table["fields"] = [
  {
    fieldId: "title",
    fieldName: "Task",
    fieldType: FieldType.TEXT_SINGLE_LINE,
  },
  {
    fieldId: "desc",
    fieldName: "Description",
    fieldType: FieldType.TEXT_MULTI_LINE,
  },
  {
    fieldId: "priority",
    fieldName: "Priority",
    fieldType: FieldType.SELECT_SINGLE,
    fieldOptions: ["P0", "P1", "P2"],
  },
  {
    fieldId: "ied",
    fieldName: "IED",
    fieldType: FieldType.NUMBER,
    fieldPrefix: "",
    fieldSuffix: "",
  },
  {
    fieldId: "email",
    fieldName: "Email",
    fieldType: FieldType.EMAIL,
  },
  {
    fieldId: "published",
    fieldName: "Published",
    fieldType: FieldType.CHECKBOX,
  },
];

let prevId = "a0";

const range = (idx: number) => {
  const ret = [];
  for (let i = 0; i < idx; i++) {
    ret.push(i);
  }
  return ret;
};

let _testTableRows: TRow[];

export const testTableRows = () => {
  if (!_testTableRows) {
    _testTableRows = range(50).map((idx) => {
      const rowId = fractionalIndex(prevId, null);
      prevId = rowId;
      return {
        rowId,
        rowData: {
          title: `This is a title ${idx}`,
          desc: `This is a description ${idx}`,
          ied: Math.max(idx % 3 || 0.5),
          priority: "P1",
          published: idx % 2 == 0,
        },
      };
    });
  }
  return _testTableRows;
};
