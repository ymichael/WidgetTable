import {
  TableField,
  FieldType,
  TRow,
  IFrameToWidgetMessage,
  WidgetToIFrameMessage,
} from "../shared/types";
import { assertUnreachable } from "../shared/utils";

const { widget } = figma;
const {
  AutoLayout,
  Text,
  useSyncedState,
  useSyncedMap,
  useEffect,
  usePropertyMenu,
} = widget;

class SyncedTable {
  ROW_AUTO_INCR_KEY = "row-auto-incr-key";
  TABLE_TITLE_KEY = "table-title-key";

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

  getTitle(): string {
    return this.metadata.get(this.TABLE_TITLE_KEY) || "Untitled";
  }

  appendRow(rowData: TRow["rowData"]): void {
    this.rows.set(`${this.genRowId()}`, rowData);
  }

  updateRow(rowId: string, rowData: TRow["rowData"]): void {
    this.rows.set(rowId, rowData);
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
    fieldId: "step",
    fieldName: "Step",
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

function widthForFieldType(fieldType: FieldType): number {
  switch (fieldType) {
    case FieldType.TEXT_MULTI_LINE:
      return 250;
    case FieldType.SELECT_MULTIPLE:
      return 80;
    case FieldType.SELECT_SINGLE:
    case FieldType.CHECKBOX:
      return 60;
    case FieldType.URL:
      return 150;
    case FieldType.TEXT_SINGLE_LINE:
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
      horizontalAlignText="left"
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

function Pill({ value }: { key?: string; value: string }) {
  return (
    <AutoLayout
      cornerRadius={10}
      fill="#EEE"
      width="hug-contents"
      padding={{ horizontal: 10, vertical: 5 }}
    >
      <Text fontSize={12} fontFamily="Inter" fontWeight={400} fill="#2A2A2A">
        {value}
      </Text>
    </AutoLayout>
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
  if (value && fieldType === FieldType.SELECT_SINGLE) {
    return (
      <AutoLayout width={widthForFieldType(fieldType)}>
        <Pill value={value} />
      </AutoLayout>
    );
  }
  if (fieldType === FieldType.SELECT_MULTIPLE) {
    return (
      <AutoLayout spacing={5} width={widthForFieldType(fieldType)}>
        {value?.map((v, idx) => (
          <Pill key={idx} value={v} />
        ))}
      </AutoLayout>
    );
  }

  const additionalProps: any = {};
  if (value && fieldType === FieldType.URL) {
    additionalProps["href"] = value;
  }

  return (
    <Text
      fontSize={12}
      fontFamily="Inter"
      fontWeight={400}
      width={widthForFieldType(fieldType)}
      fill="#2A2A2A"
      {...additionalProps}
    >
      {fieldType === FieldType.CHECKBOX ? !!value : value ?? ""}
    </Text>
  );
}

const SPACING_VERTICAL = 15;
const SPACING_HORIZONTAL = 20;
const IFRAME_WIDTH = 500;

const showUIWithPayload = (payload: WidgetToIFrameMessage): Promise<void> => {
  return new Promise(() => {
    figma.showUI(
      `<script>
          window.widgetPayload = ${JSON.stringify(payload)};
        </script>
        ${__html__}
      `,
      {
        width: IFRAME_WIDTH,
        height: payload.type === "EDIT_SCHEMA" ? 600 : 308,
      }
    );
  });
};

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
        step: "Insert Widget",
        desc: "The first step to using this widget is inserting it into FigJam! Congratulations you have completed this step.",
        completed: true,
      });
      syncedTable.appendRow({
        step: "Customise Fields",
        desc: "This widget supports various field types. Customize your table fields accordingly for you use case.",
      });
      syncedTable.appendRow({
        step: "Add / Edit / Remove Rows",
        desc: "Edit the rows in your widget. We'll make sure that each row follows the field type specified above.",
      });
    }

    figma.ui.onmessage = (msg: IFrameToWidgetMessage) => {
      switch (msg.type) {
        case "RESIZE":
          figma.ui.resize(IFRAME_WIDTH, Math.min(600, Math.round(msg.height)));
          break;
        case "NEW_ROW":
          syncedTable.appendRow(msg.row.rowData);
          if (!msg.fromEdit) {
            figma.closePlugin();
          }
          break;
        case "EDIT_ROW":
          syncedTable.updateRow(msg.row.rowId, msg.row.rowData);
          figma.closePlugin();
          break;
        case "DELETE_ROW":
          syncedTable.deleteRow(msg.row.rowId);
          figma.closePlugin();
          break;
        case "UPDATE_SCHEMA":
          setTableSchema(
            msg.fields.map((field) => {
              if (!field.fieldId) {
                field.fieldId = field.fieldName.toLowerCase();
              }
              return field;
            })
          );
          figma.closePlugin();
          break;
        default:
          assertUnreachable(msg);
      }
    };
  });
  usePropertyMenu(
    [
      {
        itemType: "action",
        tooltip: "Add Row",
        propertyName: "newRow",
      },
      {
        itemType: "action",
        tooltip: "Edit Table Schema",
        propertyName: "editSchema",
      },
    ],
    ({ propertyName }) => {
      if (propertyName === "editSchema") {
        return showUIWithPayload({
          type: "EDIT_SCHEMA",
          fields: tableSchema,
        });
      } else if (propertyName === "newRow") {
        return showUIWithPayload({
          type: "NEW_ROW",
          fields: tableSchema,
        });
      }
    }
  );

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
          {syncedTable.getTitle()}
        </Text>
      </AutoLayout>
      <AutoLayout
        direction="vertical"
        spacing={8}
        padding={{ horizontal: 15, bottom: 20 }}
      >
        <AutoLayout spacing={SPACING_HORIZONTAL}>
          <RowIdx idx={0} />
          {tableSchema.map((field) => {
            return (
              <ColumnHeader
                key={field.fieldId}
                fieldType={field.fieldType}
                fieldName={field.fieldName}
              />
            );
          })}
        </AutoLayout>
        <AutoLayout direction="vertical" spacing={SPACING_VERTICAL}>
          {syncedTable.getRows().map(([rowKey, row], idx) => {
            return (
              <AutoLayout
                spacing={SPACING_HORIZONTAL}
                key={rowKey}
                onClick={() => {
                  return showUIWithPayload({
                    type: "EDIT_ROW",
                    fields: tableSchema,
                    row: {
                      rowId: rowKey,
                      rowData: row,
                    },
                  });
                }}
              >
                <RowIdx idx={idx + 1} />
                {tableSchema.map((field) => {
                  return (
                    <CellValue
                      key={field.fieldId}
                      fieldType={field.fieldType}
                      value={row[field.fieldId]}
                    />
                  );
                })}
              </AutoLayout>
            );
          })}
          <AutoLayout
            width="fill-parent"
            fill={{
              type: "solid",
              opacity: 0.5,
              color: {
                r: 0.6588332653045654,
                g: 0.24583333730697632,
                b: 0.9833333492279053,
                a: 0.14000000059604645,
              },
            }}
            cornerRadius={20}
            padding={10}
            horizontalAlignItems="center"
            verticalAlignItems="center"
            onClick={() => {
              return showUIWithPayload({
                type: "NEW_ROW",
                fields: tableSchema,
              });
            }}
          >
            <Text fontSize={12} fontFamily="Inter">
              New Row
            </Text>
          </AutoLayout>
        </AutoLayout>
      </AutoLayout>
    </AutoLayout>
  );
}
widget.register(Table);
