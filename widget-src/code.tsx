import {
  TableField,
  FieldType,
  Table,
  TRow,
  SortOrder,
  IFrameToWidgetMessage,
  WidgetToIFramePostMessage,
  WidgetToIFrameShowUIMessage,
} from "../shared/types";
import { themes, Theme, getTheme, getRandomTheme } from "../shared/theme";
import { Template, TEMPLATES, DEFAULT_SCHEMA } from "./constants";
import {
  editSvg,
  checkedSvg,
  uncheckedSvg,
  plusSvg,
  databaseSvg,
  trashCanSvg,
} from "./svgSrc";
import { assertUnreachable, widthForFieldType } from "../shared/utils";
import SyncedTable from "./syncedTable";
import {
  importStickiesOnPage,
  importSelectedStickiesOnPage,
} from "./importUtils";

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

function getInitialSizeForPayload({
  type,
  table,
}: WidgetToIFrameShowUIMessage): [number, number] {
  switch (type) {
    case "EDIT_SCHEMA":
    case "FULL_TABLE":
      const fieldWidthSum = table.fields.reduce(
        (acc, f) => widthForFieldType(f.fieldType, true /* isForm */) + acc,
        0
      );
      return [500 + fieldWidthSum, 600];
    default:
      return [400, Math.min(200 + table.fields.length * 100, 500)];
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
      case "UPDATE_SORT_ORDER":
        syncedTable.setSortOrder(msg.sortOrder);
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
  field,
  sortOrder,
  syncedTable,
}: {
  key: any;
  field: TableField;
  syncedTable: SyncedTable;
  sortOrder: SortOrder;
}) {
  const isSortedByField = sortOrder?.fieldId === field.fieldId;
  const strBuilder = [
    field.fieldName,
    field.fieldType === FieldType.CURRENCY
      ? ` (${field.fieldCurrencySymbol})`
      : "",
    isSortedByField ? (sortOrder?.reverse ? " ↑" : " ↓") : "",
  ];
  return (
    <Text
      fontSize={10}
      fontFamily="Inter"
      fontWeight="semi-bold"
      horizontalAlignText="left"
      width={widthForFieldType(field.fieldType)}
      fill={{
        type: "solid",
        color: "#2A2A2A",
        opacity: 0.5,
      }}
      onClick={() => {
        if (isSortedByField) {
          if (sortOrder.reverse) {
            syncedTable.setSortOrder(null);
          } else {
            syncedTable.setSortOrder({ fieldId: field.fieldId, reverse: true });
          }
        } else {
          syncedTable.setSortOrder({ fieldId: field.fieldId, reverse: false });
        }
      }}
    >
      {strBuilder.join("")}
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
  key?: any;
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
          {value?.map((v: string, idx: number) => (
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
            if (!figma.currentUser?.id) {
              figma.notify("You must be logged in to vote.");
              return;
            }
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
  const isNumber = fieldType === FieldType.NUMBER;
  const isCurrency = fieldType === FieldType.CURRENCY;
  const fieldPrefix =
    (isNumber && field.fieldPrefix ? field.fieldPrefix : "") ||
    (isCurrency && !field.fieldCurrencySymbolIsSuffix
      ? field.fieldCurrencySymbol
      : "");
  const fieldSuffix =
    (isNumber && field.fieldSuffix ? field.fieldSuffix : "") ||
    (isCurrency && field.fieldCurrencySymbolIsSuffix
      ? field.fieldCurrencySymbol
      : "");
  return (
    <Text
      fontSize={12}
      fontFamily="Inter"
      fontWeight={400}
      width={widthForFieldType(fieldType)}
      fill="#2A2A2A"
      {...additionalProps}
    >
      {value && fieldPrefix ? fieldPrefix : ""}
      {value ?? ""}
      {value && fieldSuffix ? fieldSuffix : ""}
    </Text>
  );
}

function ButtonRow({
  onClick,
  width = "fill-parent",
  size = "regular",
  theme,
  children,
}: {
  width?: "fill-parent" | "hug-contents" | number;
  theme: Theme;
  size?: "regular" | "large";
  onClick: () => void;
  children?: any;
  key?: any;
}) {
  return (
    <AutoLayout
      width={width}
      cornerRadius={20}
      fill={theme.LIGHT}
      padding={size === "regular" ? 10 : 20}
      horizontalAlignItems="center"
      verticalAlignItems="center"
      onClick={onClick}
    >
      <Text
        fontSize={size === "regular" ? 12 : 16}
        fontWeight={size === "regular" ? 500 : 800}
        fontFamily="Inter"
      >
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

function TemplateTile({
  template,
  theme,
  syncedTable,
}: {
  template: Template;
  theme: Theme;
  syncedTable: SyncedTable;
}) {
  return (
    <AutoLayout
      direction="vertical"
      spacing={5}
      height={100}
      width={160}
      padding={10}
      verticalAlignItems="start"
      cornerRadius={8}
      fill={theme.LIGHT}
      onClick={() => {
        syncedTable.setTitle(template.defaultTitle);
        syncedTable.setSchema(template.defaultSchema);
        syncedTable.setSortOrder(template.defaultSortOrder);
        template.defaultRows.forEach((r) => syncedTable.appendRow(r));
      }}
    >
      <Text fontFamily="Inter" fontWeight={800} fontSize={14} width={120}>
        {template.title}
      </Text>
      <Text fontFamily="Inter" fontWeight={400} fontSize={12} width={120}>
        {template.description ?? ""}
      </Text>
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
        <Text fontFamily="Inter" fontSize={18} fontWeight={500} fill="#FFF">
          Get Started
        </Text>
      }
    >
      <AutoLayout direction="vertical" spacing={20}>
        <AutoLayout direction="vertical" width="fill-parent" spacing={8}>
          <Text fontFamily="Inter" fontSize={18} fontWeight={600}>
            Quick Start
          </Text>
          <ButtonRow
            size="large"
            width="fill-parent"
            theme={theme}
            onClick={() => {
              syncedTable.setSchema(DEFAULT_SCHEMA);
              return showUIWithPayload({
                type: "EDIT_SCHEMA",
                table: {
                  name: syncedTable.getTitle(),
                  sortOrder: syncedTable.sortOrder,
                  theme: theme.name,
                  fields: DEFAULT_SCHEMA,
                },
              });
            }}
          >
            New Table
          </ButtonRow>
          <AutoLayout direction="horizontal" spacing={10}>
            <ButtonRow
              size="large"
              width={160}
              theme={theme}
              onClick={() => {
                importStickiesOnPage(syncedTable);
              }}
            >
              Import Stickies
            </ButtonRow>
            <ButtonRow
              size="large"
              width={160}
              theme={theme}
              onClick={() => {
                importSelectedStickiesOnPage(syncedTable);
              }}
            >
              Import Selection
            </ButtonRow>
          </AutoLayout>
        </AutoLayout>
        <AutoLayout direction="vertical" spacing={8}>
          <Text fontFamily="Inter" fontSize={18} fontWeight={600}>
            Templates
          </Text>
          {TEMPLATES.map((template, idx) => {
            return idx % 2 !== 0 ? null : (
              <AutoLayout key={idx} direction="horizontal" spacing={10}>
                <TemplateTile
                  template={template}
                  theme={theme}
                  syncedTable={syncedTable}
                />
                {idx + 1 <= TEMPLATES.length - 1 && (
                  <TemplateTile
                    theme={theme}
                    template={TEMPLATES[idx + 1]}
                    syncedTable={syncedTable}
                  />
                )}
              </AutoLayout>
            );
          })}
        </AutoLayout>
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
  const table: Table = {
    name: syncedTable.getTitle(),
    sortOrder: syncedTable.sortOrder,
    theme: theme.name,
    fields: tableSchema,
  };

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
          rows: syncedTable.getRowsSorted(),
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
    [
      ...(showInitialState
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
              icon: editSvg,
            },
            {
              itemType: "action",
              tooltip: "Delete All",
              propertyName: "deleteAllRows",
              icon: trashCanSvg,
            },
            { itemType: "separator" },
          ]),
      {
        itemType: "color-selector",
        tooltip: "Theme",
        propertyName: "setTheme",
        selectedOption: theme.PRIMARY,
        options: Object.values(themes).map((t) => {
          return {
            tooltip: t.name,
            option: t.PRIMARY,
          };
        }),
      },
    ] as WidgetPropertyMenuItem[],
    ({ propertyName, propertyValue }) => {
      if (propertyName === "editSchema") {
        return showUIWithPayload({ type: "EDIT_SCHEMA", table });
      } else if (propertyName === "editTable") {
        return showUIWithPayload({
          type: "FULL_TABLE",
          table,
          rows: syncedTable.getRowsSorted(),
        });
      } else if (propertyName === "setTheme") {
        const selectedTheme = Object.values(themes).find(
          (t) => t.PRIMARY === propertyValue
        );
        if (selectedTheme) {
          syncedTable.setTheme(selectedTheme.name);
        }
      } else if (propertyName === "newRow") {
        return showUIWithPayload({ type: "NEW_ROW", table });
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
              rows: syncedTable.getRowsSorted(),
              table,
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
              field={field}
              syncedTable={syncedTable}
              sortOrder={syncedTable.sortOrder}
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
        {syncedTable.getRowsSorted().map(({ rowId, rowData }, idx) => {
          const onEditRow = () => {
            return showUIWithPayload({
              type: "EDIT_ROW",
              table,
              row: { rowId, rowData },
            });
          };
          return (
            <AutoLayout spacing={SPACING_HORIZONTAL} key={rowId}>
              <RowIdx idx={idx + 1} />
              {tableSchema.map((field) => {
                return (
                  <CellValue
                    theme={theme}
                    onEditRow={onEditRow}
                    syncedTable={syncedTable}
                    key={field.fieldId}
                    rowKey={rowId}
                    field={field}
                    value={rowData[field.fieldId]}
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
          return showUIWithPayload({ type: "NEW_ROW", table });
        }}
      >
        New Row
      </ButtonRow>
    </TableFrame>
  );
}

widget.register(Table);
