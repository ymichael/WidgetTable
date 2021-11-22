import {
  TableField,
  FieldType,
  TRow,
  IFrameToWidgetMessage,
  WidgetToIFramePostMessage,
  WidgetToIFrameShowUIMessage,
} from "../shared/types";
import { Theme, getTheme, getRandomTheme } from "../shared/theme";
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
const IFRAME_WIDTH = 800;

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

function getInitialSizeForPayload({
  type,
  fields,
}: WidgetToIFrameShowUIMessage): [number, number] {
  switch (type) {
    case "EDIT_SCHEMA":
    case "FULL_TABLE":
      const fieldWidthSum = fields.reduce(
        (acc, f) => widthForFieldType(f.fieldType, true /* isForm */) + acc,
        0
      );
      return [500 + fieldWidthSum, 600];
    default:
      return [400, Math.min(200 + fields.length * 100, 500)];
  }
}

const showUIWithPayload = (
  payload: WidgetToIFrameShowUIMessage
): Promise<void> => {
  const [width, height] = getInitialSizeForPayload(payload);
  return new Promise(() => {
    figma.showUI(
      `<script>
          window.widgetPayload = ${JSON.stringify(payload)};
        </script>
        ${__html__}
      `,
      {
        width,
        height,
      }
    );
  });
};

const genIFrameToWidgetMessageHandler = (syncedTable: SyncedTable) => {
  return (msg: IFrameToWidgetMessage) => {
    switch (msg.type) {
      case "RESIZE":
        if (msg.payloadType === "FULL_TABLE") {
          figma.ui.resize(msg.width, Math.max(600, Math.round(msg.height)));
        } else {
          figma.ui.resize(msg.width, Math.min(600, Math.round(msg.height)));
        }
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
        if (msg.closeIframe) {
          figma.closePlugin();
        }
        break;
      case "RENAME_TABLE":
        syncedTable.setTitle(msg.name);
        if (msg.closeIframe) {
          figma.closePlugin();
        }
        break;
      case "REORDER_ROW":
        const newRowId = syncedTable.moveRow(msg.rowId, msg.newRowId);
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
  theme,
}: {
  key?: string;
  value: any;
  theme: Theme;
  onClick?: () => void;
}) {
  const additionalProps = onClick ? { onClick } : {};
  return (
    <AutoLayout
      cornerRadius={10}
      fill={theme.LIGHT}
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
  theme,
  onEditRow,
}: {
  key: any;
  value: any;
  syncedTable: SyncedTable;
  rowKey: string;
  field: TableField;
  theme: Theme;
  onEditRow: () => void;
}) {
  const { fieldId, fieldType } = field;
  if (value) {
    if (fieldType === FieldType.SELECT_SINGLE) {
      return (
        <AutoLayout width={widthForFieldType(fieldType)}>
          <Pill value={value} theme={theme} />
        </AutoLayout>
      );
    }
    if (fieldType === FieldType.SELECT_MULTIPLE) {
      return (
        <AutoLayout spacing={5} width={widthForFieldType(fieldType)}>
          {value?.map((v, idx) => (
            <Pill key={idx} value={v} theme={theme} />
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
          theme={theme}
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
  theme,
  children,
}: {
  width?: "fill-parent" | "hug-contents" | number;
  theme: Theme;
  onClick: () => void;
  children?: any;
  key?: any;
}) {
  return (
    <AutoLayout
      width={width}
      fill={theme.LIGHT}
      cornerRadius={20}
      padding={10}
      horizontalAlignItems="center"
      verticalAlignItems="center"
      onClick={onClick}
    >
      <Text fontSize={12} fontWeight={500} fontFamily="Inter">
        {children}
      </Text>
    </AutoLayout>
  );
}

function TableFrame({
  headerChildren,
  theme,
  children,
}: {
  theme: Theme;
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
      stroke={theme.PRIMARY}
    >
      <AutoLayout
        height={40}
        width="fill-parent"
        fill={theme.PRIMARY}
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

function TablePlaceholder({
  theme,
  syncedTable,
}: {
  theme: Theme;
  syncedTable: SyncedTable;
}) {
  return (
    <TableFrame
      theme={theme}
      headerChildren={
        <Text fontFamily="Inter" fontSize={16} fontWeight={500} fill="#FFF">
          Get Started
        </Text>
      }
    >
      <AutoLayout direction="vertical" spacing={10}>
        <ButtonRow
          width={300}
          theme={theme}
          onClick={() => {
            syncedTable.setSchema(DEFAULT_SCHEMA);
            return showUIWithPayload({
              type: "EDIT_SCHEMA",
              title: syncedTable.getTitle(),
              themeName: theme.name,
              fields: DEFAULT_SCHEMA,
            });
          }}
        >
          Create Table
        </ButtonRow>
        <ButtonRow
          width={300}
          theme={theme}
          onClick={() => {
            const stickies = figma.currentPage.findChildren(
              isSticky
            ) as StickyNode[];
            if (stickies.length === 0) {
              figma.notify("Could not find any stickies");
              return;
            }
            importStickies(syncedTable, stickies);
          }}
        >
          {"Import all stickies"}
        </ButtonRow>
        <ButtonRow
          width={300}
          theme={theme}
          onClick={() => {
            const stickies: StickyNode[] =
              figma.currentPage.selection.filter(isSticky);
            if (stickies.length === 0) {
              figma.notify("Select stickies to import");
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

const randomTheme = getRandomTheme();

function Table() {
  const tableMetadata = useSyncedMap<any>("tableMetadata");
  const tableVotes = useSyncedMap<boolean>("tableVotes");
  const tableRows = useSyncedMap<TRow["rowData"]>("tableRows");
  const syncedTable = new SyncedTable(tableMetadata, tableRows, tableVotes);
  const tableSchema = syncedTable.schema;
  const showInitialState = tableSchema.length === 0;

  let tableTitle = syncedTable.getTitle();
  let rowsVersion = syncedTable.rowsVersion;
  let schemaVersion = syncedTable.schemaVersion;
  const theme = syncedTable.theme ? getTheme(syncedTable.theme) : randomTheme;

  useEffect(() => {
    if (!syncedTable.theme) {
      syncedTable.setTheme(theme.name);
    }

    figma.ui.onmessage = genIFrameToWidgetMessageHandler(syncedTable);
    const timer = setInterval(() => {
      if (rowsVersion !== syncedTable.rowsVersion) {
        rowsVersion = syncedTable.rowsVersion;
        const updateRowsMsg: WidgetToIFramePostMessage = {
          type: "UPDATE_ROWS",
          rows: syncedTable.getRows().map(([rowKey, row]) => ({
            rowId: rowKey,
            rowData: row,
          })),
        };
        figma.ui.postMessage(updateRowsMsg);
        syncedTable.forceRerender();
      }
      if (tableTitle !== syncedTable.getTitle()) {
        tableTitle = syncedTable.getTitle();
        const updateTitleMsg: WidgetToIFramePostMessage = {
          type: "UPDATE_TITLE",
          title: tableTitle,
        };
        figma.ui.postMessage(updateTitleMsg);
        syncedTable.forceRerender();
      }
      if (schemaVersion !== syncedTable.schemaVersion) {
        schemaVersion = syncedTable.schemaVersion;
        const updateSchemaMsg: WidgetToIFramePostMessage = {
          type: "UPDATE_SCHEMA",
          fields: syncedTable.schema,
        };
        figma.ui.postMessage(updateSchemaMsg);
        syncedTable.forceRerender();
      }
    }, 1000);
    return () => clearInterval(timer);
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
          title: tableTitle,
          themeName: theme.name,
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
          themeName: theme.name,
          title: tableTitle,
        });
      } else if (propertyName === "newRow") {
        return showUIWithPayload({
          type: "NEW_ROW",
          title: tableTitle,
          themeName: theme.name,
          fields: tableSchema,
        });
      } else if (propertyName === "deleteAllRows") {
        syncedTable.deleteAllRows();
      }
    }
  );

  if (showInitialState) {
    return <TablePlaceholder theme={theme} syncedTable={syncedTable} />;
  }

  return (
    <TableFrame
      theme={theme}
      headerChildren={
        <Text
          fontFamily="Inter"
          fontSize={18}
          fontWeight={500}
          fill="#FFF"
          onClick={() => {
            return showUIWithPayload({
              type: "FULL_TABLE",
              title: tableTitle,
              rows: syncedTable.getRows().map(([rowKey, row]) => ({
                rowId: rowKey,
                rowData: row,
              })),
              themeName: theme.name,
              fields: tableSchema,
            });
          }}
        >
          {tableTitle || "Untitled"}
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
              title: tableTitle,
              fields: tableSchema,
              themeName: theme.name,
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
                    theme={theme}
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
        theme={theme}
        onClick={() => {
          return showUIWithPayload({
            type: "NEW_ROW",
            title: tableTitle,
            fields: tableSchema,
            themeName: theme.name,
          });
        }}
      >
        New Row
      </ButtonRow>
    </TableFrame>
  );
}

widget.register(Table);
