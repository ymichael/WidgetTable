import { TRow, FieldType, TableField } from "../shared/types";
import fractionalIndex from "../shared/fractional-indexing";
import { assertUnreachable } from "../shared/utils";

export const FIELD_TYPE_READABLE: Record<FieldType, string> = {
  TEXT_SINGLE_LINE: "Single line text",
  TEXT_MULTI_LINE: "Multi-line text",
  URL: "URL",
  EMAIL: "Email",
  DATE: "Date",
  CURRENCY: "Currency",
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
  VOTE: "The vote field is useful for enabling voting on rows. Every user is allowed to vote once.",
  DATE: "The date field is useful for values that represent dates.",
  CURRENCY: "The currency field is useful for monetary values.",
  EMAIL:
    "The email field is useful if you intend to store a single email address in this field.",
  CHECKBOX: "The checkbox field type is useful for true / false values.",
  SELECT_SINGLE:
    "The single select field type is ideal when you want to ensure that one of a preset list of options is chosen.",
  SELECT_MULTIPLE:
    "The multi select field is similar to the single select field but allows for multiple options to be chosen.",
};

function getTestFieldIdFromFieldType(fieldType: FieldType): string {
  return fieldType.toLowerCase();
}

function getTestTableSchemaForField(fieldType: FieldType): TableField {
  const commonFieldProps: Pick<TableField, "fieldId" | "fieldName"> = {
    fieldId: getTestFieldIdFromFieldType(fieldType),
    fieldName:
      fieldType.charAt(0).toUpperCase() + fieldType.substr(1).toLowerCase(),
  };

  switch (fieldType) {
    case FieldType.SELECT_SINGLE:
    case FieldType.SELECT_MULTIPLE:
      return {
        ...commonFieldProps,
        fieldType,
        fieldOptions: ["P0", "P1", "P2"],
      };
    case FieldType.DATE:
      return {
        ...commonFieldProps,
        fieldType,
      };
    case FieldType.CURRENCY:
      return {
        ...commonFieldProps,
        fieldType,
        fieldCurrencySymbol: "$",
        fieldCurrencySymbolIsSuffix: false,
      };
    case FieldType.NUMBER:
      return {
        ...commonFieldProps,
        fieldType,
        fieldPrefix: "",
        fieldSuffix: "%",
      };
    case FieldType.TEXT_SINGLE_LINE:
    case FieldType.TEXT_MULTI_LINE:
    case FieldType.VOTE:
    case FieldType.EMAIL:
    case FieldType.URL:
    case FieldType.CHECKBOX:
      return {
        fieldType,
        ...commonFieldProps,
      };
    default:
      assertUnreachable(fieldType);
  }
}

const TEST_TABLE_SCHEMA: TableField[] = Object.keys(FieldType).map((k) => {
  return getTestTableSchemaForField((FieldType as any)[k]);
});

export const TEST_TABLE = {
  name: "Test Table",
  theme: "red",
  fields: TEST_TABLE_SCHEMA,
};

function getTestFieldRowData(rowIdx: number): TRow["rowData"] {
  const ret: any = {};
  TEST_TABLE_SCHEMA.forEach((field) => {
    const fieldId = getTestFieldIdFromFieldType(field.fieldType);
    switch (field.fieldType) {
      case FieldType.TEXT_SINGLE_LINE:
        ret[fieldId] = `Test Text ${rowIdx}`;
        break;
      case FieldType.TEXT_MULTI_LINE:
        ret[fieldId] = `This is a test multi-line text ${rowIdx}`;
        break;
      case FieldType.EMAIL:
      case FieldType.URL:
      case FieldType.CURRENCY:
      case FieldType.DATE:
        ret[fieldId] = "";
        break;
      case FieldType.NUMBER:
        ret[fieldId] = rowIdx;
        break;
      case FieldType.CHECKBOX:
        ret[fieldId] = rowIdx % 2 === 0;
        break;
      case FieldType.VOTE:
        return;
      case FieldType.SELECT_SINGLE:
        ret[fieldId] = rowIdx % 2 === 0 ? "P0" : "P1";
        break;
      case FieldType.SELECT_MULTIPLE:
        ret[fieldId] = rowIdx % 2 === 0 ? ["P0"] : ["P0", "P1"];
        break;
      default:
        assertUnreachable(field);
    }
  });
  return ret;
}

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
    _testTableRows = range(5).map((idx) => {
      const rowId = fractionalIndex(prevId, null);
      prevId = rowId;
      return {
        rowId,
        rowData: getTestFieldRowData(idx),
      };
    });
  }
  return _testTableRows;
};
