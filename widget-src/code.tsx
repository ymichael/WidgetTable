import {
  TableField,
  FieldType,
  TRow,
  IFrameToWidgetMessage,
  WidgetToIFramePostMessage,
  WidgetToIFrameShowUIMessage,
} from "../shared/types";
import {
  DEFAULT_SCHEMA,
  STICKY_SCHEMA,
  STICKY_NO_AUTHOR_SCHEMA,
} from "./constants";
import {
  checkedSvg,
  uncheckedSvg,
  plusSvg,
  databaseSvg,
  trashCanSvg,
} from "./svgSrc";
import { assertUnreachable, widthForFieldType } from "../shared/utils";
import SyncedTable from "./syncedTable";

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

const SPACING_VERTICAL = 15;
const SPACING_HORIZONTAL = 20;
const IFRAME_WIDTH = 500;

function isSticky(node: SceneNode): node is StickyNode {
  return node.type === "STICKY";
}

function importStickies(
  syncedTable: SyncedTable,
  stickies: StickyNode[]
): void {
  const hasVisibleAuthor = stickies.some((x) => x.authorVisible);
  syncedTable.setSchema(
    hasVisibleAuthor ? STICKY_SCHEMA : STICKY_NO_AUTHOR_SCHEMA
  );
  syncedTable.setTitle("Stickies");
  stickies.forEach((sticky) => {
    syncedTable.appendRow({
      text: sticky.text.characters,
      // @ts-expect-error
      author: sticky.authorVisible ? sticky.authorName : "",
    });
  });
}

function getInitialHeightForPayload(
  payload: WidgetToIFrameShowUIMessage
): number {
  switch (payload.type) {
    case "EDIT_SCHEMA":
      return 600;
    case "FULL_TABLE":
      return 800;
    default:
      return 308;
  }
}

const showUIWithPayload = (
  payload: WidgetToIFrameShowUIMessage
): Promise<void> => {
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
      width={20}
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
  value,
  field,
  syncedTable,
  rowKey,
  onEditRow,
}: {
  key: any;
  value: any;
  syncedTable: SyncedTable;
  rowKey: string;
  field: TableField;
  onEditRow: () => void;
}) {
  const { fieldId, fieldType } = field;
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
          fill="#FFF"
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

  const suffixOrPrefix = value && fieldType === FieldType.NUMBER;
  return (
    <Text
      fontSize={12}
      fontFamily="Inter"
      fontWeight={400}
      width={widthForFieldType(fieldType)}
      fill="#2A2A2A"
      {...additionalProps}
    >
      {suffixOrPrefix && field.fieldPrefix ? field.fieldPrefix : ""}
      {value ?? ""}
      {suffixOrPrefix && field.fieldSuffix ? field.fieldSuffix : ""}
    </Text>
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
      <AutoLayout direction="vertical" padding={{ horizontal: 15, bottom: 20 }}>
        {children}
      </AutoLayout>
    </AutoLayout>
  );
}

function Table() {
  const tableMetadata = useSyncedMap<any>("tableMetadata");
  const tableVotes = useSyncedMap<boolean>("tableVotes");
  const tableRows = useSyncedMap<TRow["rowData"]>("tableRows");
  const syncedTable = new SyncedTable(tableMetadata, tableRows, tableVotes);
  const tableSchema = syncedTable.schema;

  const showInitialState = tableSchema.length === 0;
  useEffect(() => {
    figma.ui.onmessage = (msg: IFrameToWidgetMessage) => {
      switch (msg.type) {
        case "RESIZE":
          figma.ui.resize(msg.width, Math.min(600, Math.round(msg.height)));
          break;
        case "NEW_ROW":
          syncedTable.appendRow(msg.row.rowData);
          if (msg.closeIframe) {
            figma.closePlugin();
          }
          break;
        case "UPSERT_ROW":
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
        case "REORDER_ROW":
          const newRowId = syncedTable.moveRow(
            msg.rowId,
            msg.beforeRowId,
            msg.afterRowId
          );
          if (newRowId) {
            const message: WidgetToIFramePostMessage = {
              type: "UPDATE_ROW_ORDER",
              orderedRowIds: syncedTable.getRowIdsOrdered(),
              updatedRowIds: {
                [msg.rowId]: newRowId,
              },
            };
            figma.ui.postMessage(message);
          }
          break;
        case "UPDATE_SCHEMA":
          syncedTable.setSchema(
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
            tooltip: "Insert Row",
            propertyName: "newRow",
            icon: plusSvg,
          },
          {
            itemType: "action",
            tooltip: "Edit Table",
            propertyName: "editTable",
            icon: databaseSvg,
          },
          {
            itemType: "action",
            tooltip: "Delete All",
            propertyName: "deleteAllRows",
            icon: trashCanSvg,
          },
        ],
    ({ propertyName }) => {
      if (propertyName === "editSchema") {
        return showUIWithPayload({
          type: "EDIT_SCHEMA",
          title: syncedTable.getTitle(),
          fields: tableSchema,
        });
      } else if (propertyName === "editTable") {
        return showUIWithPayload({
          type: "FULL_TABLE",
          fields: tableSchema,
          rows: syncedTable.getRows().map(([rowKey, row]) => ({
            rowId: rowKey,
            rowData: row,
          })),
          title: syncedTable.getTitle(),
        });
      } else if (propertyName === "newRow") {
        return showUIWithPayload({
          type: "NEW_ROW",
          title: syncedTable.getTitle(),
          fields: tableSchema,
        });
      } else if (propertyName === "deleteAllRows") {
        syncedTable.deleteAllRows();
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
        <AutoLayout direction="vertical" spacing={10}>
          <ButtonRow
            width={300}
            onClick={() => {
              syncedTable.setSchema(DEFAULT_SCHEMA);
              return showUIWithPayload({
                type: "EDIT_SCHEMA",
                title: syncedTable.getTitle(),
                fields: DEFAULT_SCHEMA,
              });
            }}
          >
            Create Table
          </ButtonRow>
          <ButtonRow
            width={300}
            onClick={() => {
              const stickies = figma.currentPage.findChildren(
                isSticky
              ) as StickyNode[];
              importStickies(syncedTable, stickies);
            }}
          >
            {"Import all stickies"}
          </ButtonRow>
          <ButtonRow
            width={300}
            onClick={() => {
              const stickies: StickyNode[] =
                figma.currentPage.selection.filter(isSticky);
              if (stickies.length === 0) {
                figma.notify("Select Stickies to populate table");
                return;
              }
              importStickies(syncedTable, stickies);
            }}
          >
            {"Import selected stickies"}
          </ButtonRow>
        </AutoLayout>
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
              type: "FULL_TABLE",
              title: syncedTable.getTitle(),
              rows: syncedTable.getRows().map(([rowKey, row]) => ({
                rowId: rowKey,
                rowData: row,
              })),
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
        padding={{ bottom: 20, right: 10 }}
      >
        <Frame name="Spacer" width={200} height={1} />
        {syncedTable.getRows().map(([rowKey, row], idx) => {
          const onEditRow = () => {
            return showUIWithPayload({
              type: "EDIT_ROW",
              title: syncedTable.getTitle(),
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
                    field={field}
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
            title: syncedTable.getTitle(),
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
