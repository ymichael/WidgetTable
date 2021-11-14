import { FieldType } from "./types";

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
        return 250;
      case FieldType.NUMBER:
      case FieldType.CHECKBOX:
        return 80;
      case FieldType.SELECT_MULTIPLE:
      case FieldType.SELECT_SINGLE:
      case FieldType.VOTE:
      case FieldType.URL:
      case FieldType.EMAIL:
      case FieldType.TEXT_SINGLE_LINE:
        return 150;
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
      return 60;
    case FieldType.URL:
    case FieldType.EMAIL:
    case FieldType.TEXT_SINGLE_LINE:
      return 150;
    default:
      assertUnreachable(fieldType);
  }
}
