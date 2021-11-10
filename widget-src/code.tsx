import {
  TableField,
  FieldType,
  TRow,
  IFrameToWidgetMessage,
  WidgetToIFrameMessage,
} from "../shared/types";
import { checkedSvg, uncheckedSvg } from "./svgSrc";
import { assertUnreachable } from "../shared/utils";
import fractionalIndex from "./fractional-indexing";

const { widget } = figma;
const {
  AutoLayout,
  SVG,
  Frame,
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
    private schema: TableField[],
    private metadata: SyncedMap<any>,
    private rows: SyncedMap<TRow["rowData"]>,
    private votes: SyncedMap<boolean>
  ) {}

  private genRowId(): number {
    const currKey = this.metadata.get(this.ROW_AUTO_INCR_KEY) || "a0";
    const nextRowId = fractionalIndex(String(currKey), null);
    this.metadata.set(this.ROW_AUTO_INCR_KEY, nextRowId);
    return nextRowId;
  }

  getTitle(): string {
    return this.metadata.get(this.TABLE_TITLE_KEY) || "";
  }

  setTitle(name: string): void {
    this.metadata.set(this.TABLE_TITLE_KEY, name);
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

  getVotesMap(): { [rowId: string]: { [fieldId: string]: number } } {
    const votesMap = {};
    this.votes.keys().forEach((voteKey) => {
      const { rowId, fieldId, userId } = this.fromVoteKey(voteKey);
      votesMap[rowId] = votesMap[rowId] || {};
      votesMap[rowId][fieldId] = votesMap[rowId][fieldId] || 0;
      votesMap[rowId][fieldId] += 1;
    });
    return votesMap;
  }

  private fromVoteKey(voteKey: string): {
    rowId: string;
    fieldId: string;
    userId: string;
  } {
    const [rowId, fieldId, userId] = voteKey.split(":", 3);
    return { rowId, fieldId, userId };
  }

  private toVoteKey({
    rowId,
    fieldId,
    userId,
  }: {
    rowId: string;
    fieldId: string;
    userId: string;
  }): string {
    return `${rowId}:${fieldId}:${userId}`;
  }

  setRowFieldValue({
    rowId,
    fieldId,
    value,
  }: {
    rowId: string;
    fieldId: string;
    value: any;
  }): void {
    this.rows.set(rowId, {
      ...this.rows.get(rowId),
      [fieldId]: value,
    });
  }

  toggleVote(args: { rowId: string; fieldId: string; userId: string }): void {
    const voteKey = this.toVoteKey(args);
    if (this.votes.get(voteKey)) {
      this.votes.delete(voteKey);
    } else {
      this.votes.set(voteKey, true);
    }
  }

  getRows(): [string, TRow["rowData"]][] {
    const votesMap = this.getVotesMap();
    const rowKeys = this.rows.keys();
    rowKeys.sort();
    return rowKeys.map((k) => {
      const rowData = {
        ...this.rows.get(k),
        ...votesMap[k],
      };
      return [k, rowData];
    });
  }
}

const DEFAULT_SCHEMA: TableField[] = [
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

function widthForFieldType(fieldType: FieldType): number {
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
      width={15}
      horizontalAlignText="right"
      fill="#2A2A2A"
      opacity={0.5}
    >
      {idx > 0 ? idx : ""}
    </Text>
  );
}

function Pill({
  value,
  onClick,
}: {
  key?: string;
  value: any;
  onClick?: () => void;
}) {
  const additionalProps = onClick ? { onClick } : {};
  return (
    <AutoLayout
      cornerRadius={10}
      fill="#EEE"
      width="hug-contents"
      padding={{ horizontal: 10, vertical: 5 }}
      {...additionalProps}
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
  syncedTable,
  rowKey,
  fieldId,
  onEditRow,
}: {
  key: any;
  value: any;
  syncedTable: SyncedTable;
  fieldType: FieldType;
  rowKey: string;
  fieldId: string;
  onEditRow: () => void;
}) {
  if (value) {
    if (fieldType === FieldType.SELECT_SINGLE) {
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
  }

  if (fieldType === FieldType.VOTE) {
    return (
      <AutoLayout width={widthForFieldType(fieldType)}>
        <Pill
          value={value || 0}
          onClick={() => {
            syncedTable.toggleVote({
              rowId: rowKey,
              fieldId,
              userId: figma.currentUser.id,
            });
          }}
        />
      </AutoLayout>
    );
  }

  if (fieldType === FieldType.CHECKBOX) {
    return (
      <AutoLayout width={widthForFieldType(fieldType)}>
        <SVG
          width={20}
          height={20}
          src={!!value ? checkedSvg : uncheckedSvg}
          onClick={() => {
            syncedTable.setRowFieldValue({
              rowId: rowKey,
              fieldId,
              value: !value,
            });
          }}
        />
      </AutoLayout>
    );
  }

  const additionalProps: any = {};
  if (value && fieldType === FieldType.URL) {
    additionalProps["href"] = value;
  } else {
    additionalProps["onClick"] = onEditRow;
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
      {value ?? ""}
    </Text>
  );
}

const SPACING_VERTICAL = 15;
const SPACING_HORIZONTAL = 20;
const IFRAME_WIDTH = 500;

function getInitialHeightForPayload(payload: WidgetToIFrameMessage): number {
  switch (payload.type) {
    case "EDIT_SCHEMA":
      return 600;
    case "RENAME_TABLE":
      return 200;
    default:
      return 308;
  }
}

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
        height: getInitialHeightForPayload(payload),
      }
    );
  });
};

function TableFrame({
  headerChildren,
  children,
}: {
  headerChildren: any;
  children?: any;
}) {
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
        {headerChildren}
      </AutoLayout>
      <AutoLayout
        direction="vertical"
        spacing={8}
        padding={{ horizontal: 15, bottom: 20 }}
      >
        {children}
      </AutoLayout>
    </AutoLayout>
  );
}

function ButtonRow({
  onClick,
  width = "fill-parent",
  children,
}: {
  width?: "fill-parent" | "hug-contents" | number;
  onClick: () => void;
  children?: any;
  key?: any;
}) {
  return (
    <AutoLayout
      width={width}
      fill={{
        type: "solid",
        opacity: 0.12,
        color: { r: 0.65, g: 0.24, b: 0.98, a: 1 },
      }}
      cornerRadius={20}
      padding={10}
      horizontalAlignItems="center"
      verticalAlignItems="center"
      onClick={onClick}
    >
      <Text fontSize={12} fontFamily="Inter">
        {children}
      </Text>
    </AutoLayout>
  );
}

function Table() {
  const [tableSchema, setTableSchema] = useSyncedState<TableField[]>(
    "tableSchema",
    []
  );
  const tableMetadata = useSyncedMap<any>("tableMetadata");
  const tableVotes = useSyncedMap<boolean>("tableVotes");
  const tableRows = useSyncedMap<TRow["rowData"]>("tableRows");
  const syncedTable = new SyncedTable(
    tableSchema,
    tableMetadata,
    tableRows,
    tableVotes
  );

  const showInitialState = tableSchema.length === 0;
  useEffect(() => {
    figma.ui.onmessage = (msg: IFrameToWidgetMessage) => {
      switch (msg.type) {
        case "RESIZE":
          figma.ui.resize(IFRAME_WIDTH, Math.min(600, Math.round(msg.height)));
          break;
        case "NEW_ROW":
          syncedTable.appendRow(msg.row.rowData);
          if (msg.closeIframe) {
            figma.closePlugin();
          }
          break;
        case "EDIT_ROW":
          syncedTable.updateRow(msg.row.rowId, msg.row.rowData);
          if (msg.closeIframe) {
            figma.closePlugin();
          }
          break;
        case "DELETE_ROW":
          syncedTable.deleteRow(msg.row.rowId);
          figma.closePlugin();
          break;
        case "RENAME_TABLE":
          syncedTable.setTitle(msg.name);
          if (msg.closeIframe) {
            figma.closePlugin();
          }
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
          if (msg.closeIframe) {
            figma.closePlugin();
          }
          break;
        default:
          assertUnreachable(msg);
      }
    };
  });
  usePropertyMenu(
    showInitialState
      ? []
      : [
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

  if (showInitialState) {
    return (
      <TableFrame
        headerChildren={
          <Text fontFamily="Inter" fontSize={16} fontWeight={500} fill="#FFF">
            Get Started
          </Text>
        }
      >
        <ButtonRow
          width={400}
          onClick={() => {
            setTableSchema(DEFAULT_SCHEMA);
            return showUIWithPayload({
              type: "EDIT_SCHEMA",
              fields: DEFAULT_SCHEMA,
            });
          }}
        >
          Create Table
        </ButtonRow>
        <ButtonRow
          width={400}
          onClick={() => {
            console.log("TODO");
          }}
        >
          {"Stickies -> Table"}
        </ButtonRow>
        <ButtonRow
          width={400}
          onClick={() => {
            console.log("TODO");
          }}
        >
          {"Selection -> Table"}
        </ButtonRow>
        <ButtonRow
          width={400}
          onClick={() => {
            console.log("TODO");
          }}
        >
          {"CSV -> Table"}
        </ButtonRow>
      </TableFrame>
    );
  }

  return (
    <TableFrame
      headerChildren={
        <Text
          fontFamily="Inter"
          fontSize={18}
          fontWeight={500}
          fill="#FFF"
          onClick={() => {
            return showUIWithPayload({
              type: "RENAME_TABLE",
              name: syncedTable.getTitle(),
              fields: tableSchema,
            });
          }}
        >
          {syncedTable.getTitle() || "Untitled"}
        </Text>
      }
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
      <AutoLayout
        direction="vertical"
        spacing={SPACING_VERTICAL}
        padding={{ bottom: 10 }}
      >
        <Frame name="Spacer" width={495} height={1} />
        {syncedTable.getRows().map(([rowKey, row], idx) => {
          const onEditRow = () => {
            return showUIWithPayload({
              type: "EDIT_ROW",
              fields: tableSchema,
              row: {
                rowId: rowKey,
                rowData: row,
              },
            });
          };
          return (
            <AutoLayout spacing={SPACING_HORIZONTAL} key={rowKey}>
              <RowIdx idx={idx + 1} />
              {tableSchema.map((field) => {
                return (
                  <CellValue
                    onEditRow={onEditRow}
                    syncedTable={syncedTable}
                    key={field.fieldId}
                    rowKey={rowKey}
                    fieldId={field.fieldId}
                    fieldType={field.fieldType}
                    value={row[field.fieldId]}
                  />
                );
              })}
            </AutoLayout>
          );
        })}
      </AutoLayout>
      <ButtonRow
        onClick={() => {
          return showUIWithPayload({
            type: "NEW_ROW",
            fields: tableSchema,
          });
        }}
      >
        New Row
      </ButtonRow>
    </TableFrame>
  );
}
widget.register(Table);
