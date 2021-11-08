import { TableField } from "../shared/types";

const { widget } = figma;
const { AutoLayout, Text, useSyncedState, useSyncedMap } = widget;

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
}

function Table() {
  const [tableSchema, setTableSchema] = useSyncedState<TableField[]>(
    "tableSchema",
    []
  );
  const tableRows = useSyncedMap("tableRows");
  const tableMetadata = useSyncedMap("tableMetadata");
  const syncedTable = new SyncedTable(tableMetadata, tableRows);

  return (
    <AutoLayout
      direction="horizontal"
      horizontalAlignItems="center"
      verticalAlignItems="center"
      height="hug-contents"
      padding={8}
      fill="#FFFFFF"
      cornerRadius={8}
      spacing={12}
      onClick={async () => {
        await new Promise((resolve) => {
          figma.showUI(__html__);
          figma.ui.on("message", (msg) => {
            if (msg === "hello") {
              figma.notify(`Hello ${figma.currentUser.name}`);
            }
            if (msg === "close") {
              figma.closePlugin();
            }
          });
        });
      }}
    >
      <Text fontSize={32} horizontalAlignText="center">
        Click Me
      </Text>
    </AutoLayout>
  );
}
widget.register(Table);
