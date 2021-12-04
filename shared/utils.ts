import { TableField, SortOrder, TRow, FieldType } from "./types";

export function assertUnreachable(x: never): never {
  throw new Error("Didn't expect to get here");
}

let id = 0;

export const genId = (): string => `id-${id++}`;

export function widthForFieldType(
  fieldType: FieldType,
  isForm: boolean = false
): number {
  if (isForm) {
    switch (fieldType) {
      case FieldType.TEXT_MULTI_LINE:
        return 240;
      case FieldType.NUMBER:
      case FieldType.CURRENCY:
      case FieldType.CHECKBOX:
        return 60;
      case FieldType.DATE:
      case FieldType.SELECT_MULTIPLE:
      case FieldType.SELECT_SINGLE:
        return 150;
      case FieldType.VOTE:
      case FieldType.URL:
      case FieldType.EMAIL:
      case FieldType.TEXT_SINGLE_LINE:
        return 100;
      default:
        assertUnreachable(fieldType);
    }
  }
  switch (fieldType) {
    case FieldType.TEXT_MULTI_LINE:
      return 250;
    case FieldType.SELECT_MULTIPLE:
      return 80;
    case FieldType.SELECT_SINGLE:
    case FieldType.CHECKBOX:
    case FieldType.NUMBER:
    case FieldType.VOTE:
    case FieldType.DATE:
    case FieldType.CURRENCY:
      return 60;
    case FieldType.URL:
    case FieldType.EMAIL:
    case FieldType.TEXT_SINGLE_LINE:
      return 150;
    default:
      assertUnreachable(fieldType);
  }
}

export function sortRows(
  rows: TRow[],
  sortOrder: SortOrder,
  fields: TableField[]
): TRow[] {
  if (!sortOrder) {
    return rows;
  }

  const field = fields.find((field) => field.fieldId === sortOrder.fieldId);
  if (!field) {
    return rows;
  }

  const rowsCopy = [...rows];
  rowsCopy.sort((a, b) => {
    let aVal = a.rowData[sortOrder.fieldId];
    let bVal = b.rowData[sortOrder.fieldId];
    switch (field.fieldType) {
      case FieldType.TEXT_MULTI_LINE:
      case FieldType.TEXT_SINGLE_LINE:
      case FieldType.DATE:
      case FieldType.SELECT_MULTIPLE:
      case FieldType.SELECT_SINGLE:
      case FieldType.URL:
      case FieldType.EMAIL:
        aVal = (aVal || "") + "";
        bVal = (bVal || "") + "";
        break;
      case FieldType.NUMBER:
      case FieldType.CURRENCY:
      case FieldType.VOTE:
        aVal = aVal || 0;
        bVal = bVal || 0;
        break;
      case FieldType.CHECKBOX:
        aVal = !!aVal;
        bVal = !!bVal;
        break;
      default:
        assertUnreachable(field);
    }
    if (aVal < bVal) {
      return sortOrder.reverse ? 1 : -1;
    }
    if (bVal < aVal) {
      return sortOrder.reverse ? -1 : 1;
    }
    return 0;
  });
  return rowsCopy;
}
