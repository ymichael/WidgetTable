import { TableField, FieldType } from "../shared/types";
import { assertUnreachable } from "../shared/utils";

const { widget } = figma;
const { AutoLayout, Text, useSyncedState, useSyncedMap, useEffect } = widget;

type TRow = {
  rowId: string;
  rowData: { [key: string]: any };
};

class SyncedTable {
  ROW_AUTO_INCR_KEY = "row-auto-incr-key";

  constructor(
    private metadata: SyncedMap<any>,
    private rows: SyncedMap<TRow["rowData"]>
  ) {}

  private getKeyBetween = (from: number, to: number): number => {
    return from + Math.random() * (from - to);
  };

  private genRowId(): number {
    const nextRowIdRangeStart =
      +(this.metadata.get(this.ROW_AUTO_INCR_KEY) || 1) || 1;
    const nextRowIdRangeEnd = nextRowIdRangeStart + 1;
    const nextRowId = this.getKeyBetween(
      nextRowIdRangeStart,
      nextRowIdRangeEnd
    );

    this.metadata.set(this.ROW_AUTO_INCR_KEY, nextRowIdRangeEnd);
    return nextRowId;
  }

  appendRow(rowData: TRow["rowData"]): void {
    this.rows.set(`${this.genRowId()}`, rowData);
  }

  deleteRow(rowId: string): void {
    this.rows.delete(rowId);
  }

  getRows(): [string, TRow["rowData"]][] {
    const rowKeys = this.rows.keys();
    rowKeys.sort();
    return rowKeys.map((k) => [k, this.rows.get(k)]);
  }
}

const DEFAULT_SCHEMA: TableField[] = [
  {
    fieldName: "Step",
    fieldType: FieldType.TEXT_SINGLE_LINE,
  },
  {
    fieldName: "Description",
    fieldType: FieldType.TEXT_MULTI_LINE,
  },
  {
    fieldName: "Completed",
    fieldType: FieldType.CHECKBOX,
  },
];

function widthForFieldType(fieldType: FieldType): number {
  switch (fieldType) {
    case FieldType.TEXT_MULTI_LINE:
    case FieldType.SELECT_MULTIPLE:
      return 250;
    case FieldType.TEXT_SINGLE_LINE:
    case FieldType.SELECT_SINGLE:
    case FieldType.URL:
    case FieldType.CHECKBOX:
      return 80;
    default:
      assertUnreachable(fieldType);
  }
}

function ColumnHeader({
  fieldType,
  fieldName,
}: {
  key: any;
  fieldType: FieldType;
  fieldName: string;
}) {
  return (
    <Text
      fontSize={10}
      fontFamily="Inter"
      fontWeight="semi-bold"
      width={widthForFieldType(fieldType)}
      fill={{
        type: "solid",
        color: "#2A2A2A",
        opacity: 0.5,
      }}
    >
      {fieldName}
    </Text>
  );
}

function RowIdx({ idx }: { idx: number }) {
  return (
    <Text
      fontSize={12}
      fontFamily="Inter"
      fontWeight={400}
      width={2}
      fill="#2A2A2A"
      opacity={0.5}
    >
      {idx > 0 ? idx : ""}
    </Text>
  );
}

function CellValue({
  fieldType,
  value,
}: {
  key: any;
  fieldType: FieldType;
  value: any;
}) {
  return (
    <Text
      fontSize={12}
      fontFamily="Inter"
      fontWeight={400}
      width={widthForFieldType(fieldType)}
      fill="#2A2A2A"
    >
      {value}
    </Text>
  );
}

const SPACING_VERTICAL = 15;
const SPACING_HORIZONTAL = 30;

function Table() {
  const [tableSchema, setTableSchema] = useSyncedState<TableField[]>(
    "tableSchema",
    []
  );
  const tableMetadata = useSyncedMap<any>("tableMetadata");
  const tableRows = useSyncedMap<TRow["rowData"]>("tableRows");
  const syncedTable = new SyncedTable(tableMetadata, tableRows);
  useEffect(() => {
    if (tableSchema.length === 0 && tableRows.size === 0) {
      setTableSchema(DEFAULT_SCHEMA);
      syncedTable.appendRow({
        Step: "Insert Widget",
        Description:
          "The first step to using this widget is inserting it into FigJam! Congratulations you have completed this step.",
        Completed: true,
      });
      syncedTable.appendRow({
        Step: "Customise Fields",
        Description:
          "This widget supports various field types. Customize your table fields accordingly for you use case.",
      });
      syncedTable.appendRow({
        Step: "Add / Edit / Remove Rows",
        Description:
          "Edit the rows in your widget. We'll make sure that each row follows the field type specified above.",
      });
    }
  });

  return (
    <AutoLayout
      direction="vertical"
      height="hug-contents"
      width="hug-contents"
      padding={0}
      cornerRadius={8}
      spacing={SPACING_VERTICAL}
      strokeWidth={2}
      fill="#FFF"
      stroke="#A83FFB"
    >
      <AutoLayout
        height={40}
        width="fill-parent"
        fill="#A83FFB"
        verticalAlignItems="center"
        horizontalAlignItems="center"
      >
        <Text fontFamily="Inter" fontSize={18} fontWeight={500} fill="#FFF">
          Untitled
        </Text>
      </AutoLayout>
      <AutoLayout
        direction="vertical"
        spacing={8}
        padding={{ left: 15, bottom: 20 }}
      >
        <AutoLayout spacing={SPACING_HORIZONTAL}>
          <RowIdx idx={0} />
          {tableSchema.map((field) => {
            return (
              <ColumnHeader
                key={field.fieldName}
                fieldType={field.fieldType}
                fieldName={field.fieldName}
              />
            );
          })}
        </AutoLayout>
        <AutoLayout direction="vertical" spacing={SPACING_VERTICAL}>
          {syncedTable.getRows().map(([rowKey, row], idx) => {
            return (
              <AutoLayout spacing={SPACING_HORIZONTAL} key={rowKey}>
                <RowIdx idx={idx + 1} />
                {tableSchema.map((field) => {
                  return (
                    <CellValue
                      key={field.fieldName}
                      fieldType={field.fieldType}
                      value={row[field.fieldName]}
                    />
                  );
                })}
              </AutoLayout>
            );
          })}
        </AutoLayout>
      </AutoLayout>
    </AutoLayout>
  );
}
widget.register(Table);
