import { TableField, FieldType } from "../shared/types";

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

  getRows(): TRow["rowData"][] {
    const rowKeys = this.rows.keys();
    rowKeys.sort();
    return rowKeys.map((k) => this.rows.get(k));
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
      padding={8}
      cornerRadius={8}
      spacing={8}
    >
      <AutoLayout>
        {tableSchema.map((field) => {
          return <Text>{field.fieldName}</Text>;
        })}
      </AutoLayout>
      <AutoLayout direction="vertical">
        {syncedTable.getRows().map((row) => {
          return (
            <AutoLayout>
              {tableSchema.map((field) => {
                return <Text>{row[field.fieldName]}</Text>;
              })}
            </AutoLayout>
          );
        })}
      </AutoLayout>
    </AutoLayout>
  );
}
widget.register(Table);
