import * as React from "react";
import { useMemo, useState, useEffect } from "react";
import { isEqual } from "lodash";
import styles from "./App.module.css";

import SchemaEditor from "./SchemaEditor";
import RowEditor from "./RowEditor";
import ThemeContext from "./ThemeContext";
import Table from "./Table";
import { Sidecar, SidecarOverlay } from "./Sidecar";

import {
  TRow,
  TableField,
  SortOrder,
  WidgetToIFrameShowUIMessage,
  WidgetToIFramePostMessage,
  IFrameToWidgetMessage,
} from "../shared/types";
import fractionalIndex from "../shared/fractional-indexing";
import { assertUnreachable } from "../shared/utils";
import { getTheme } from "../shared/theme";
import { getAppRoute, AppRoute, RouteType } from "./router";

const widgetPayload: WidgetToIFrameShowUIMessage | undefined = (window as any)
  .widgetPayload;

function AppPage({ route }: { route: AppRoute }) {
  const [rows, setRows] = useState<TRow[]>(
    route.type === RouteType.FULL_TABLE ? route.rows : []
  );
  const [title, setTitle] = useState<string>(route.table.name);
  const [sortOrder, setSortOrder] = useState<SortOrder>(route.table.sortOrder);
  const [tableSchema, setTableSchema] = useState<TableField[]>(
    route.table.fields
  );
  const [showSidecar, setShowSidecar] = useState<boolean>(false);
  const rowsSorted = useMemo<TRow[]>(() => {
    if (
      !sortOrder ||
      !tableSchema.some((field) => field.fieldId === sortOrder.fieldId)
    ) {
      return rows;
    }
    const rowsCopy = [...rows];
    rowsCopy.sort((a, b) => {
      let aVal = a.rowData[sortOrder.fieldId];
      let bVal = b.rowData[sortOrder.fieldId];
      if (typeof aVal !== "number") {
        aVal += "";
        bVal += "";
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
  }, [rows, sortOrder, tableSchema]);

  useEffect(() => {
    if (!widgetPayload) {
      return;
    }
    window.onmessage = (event: any) => {
      const evt = event.data?.pluginMessage as WidgetToIFramePostMessage | null;
      if (!evt) {
        console.warn(`Unknown event: ${evt}`);
        return;
      }
      if (evt.type === "UPDATE_ROWS") {
        const rowById: Record<TRow["rowId"], TRow> = {};
        rows.forEach((r) => {
          rowById[r.rowId] = r;
        });
        const updatedRows = evt.rows.map((row) => {
          if (rowById[row.rowId] && isEqual(rowById[row.rowId], row)) {
            return rowById[row.rowId];
          } else {
            return row;
          }
        });
        setRows(updatedRows);
      } else if (evt.type === "UPDATE_SCHEMA") {
        setTableSchema(evt.fields);
      } else if (evt.type === "UPDATE_TITLE") {
        setTitle(evt.title);
      }
    };
  }, []);

  switch (route.type) {
    case RouteType.SCHEMA_EDITOR:
      return (
        <SchemaEditor
          initialValues={{ fields: tableSchema }}
          onSubmit={(v, closeIframe) => {
            if (widgetPayload) {
              const payload: IFrameToWidgetMessage = {
                type: "UPDATE_SCHEMA",
                closeIframe,
                fields: v.fields,
              };
              parent?.postMessage({ pluginMessage: payload }, "*");
            } else {
              console.log({ schema: v, closeIframe });
            }
          }}
        />
      );
    case RouteType.ROW_EDITOR:
      return (
        <RowEditor
          tableSchema={tableSchema}
          initialValues={route.isEdit ? route.row.rowData : {}}
          isEdit={route.isEdit}
          onEdit={(v, closeIframe) => {
            if (widgetPayload && route.isEdit) {
              const payload: IFrameToWidgetMessage = {
                type: "UPSERT_ROW",
                closeIframe,
                row: {
                  rowId: route.row.rowId,
                  rowData: v,
                },
              };
              parent?.postMessage({ pluginMessage: payload }, "*");
            } else {
              console.log({ onEdit: v, closeIframe });
            }
          }}
          onDelete={() => {
            if (widgetPayload && route.isEdit) {
              const payload: IFrameToWidgetMessage = {
                type: "DELETE_ROW",
                closeIframe: true,
                row: {
                  rowId: route.row.rowId,
                },
              };
              parent?.postMessage({ pluginMessage: payload }, "*");
            } else {
              console.log("onDelete");
            }
          }}
          onCreate={(v, closeIframe) => {
            if (!!widgetPayload) {
              const payload: IFrameToWidgetMessage = {
                type: "NEW_ROW",
                closeIframe,
                row: { rowData: v },
              };
              parent?.postMessage({ pluginMessage: payload }, "*");
            } else {
              console.log({ onCreate: v, closeIframe });
            }
          }}
        />
      );
    case RouteType.FULL_TABLE:
      return (
        <>
          <Table
            title={title}
            tableSchema={tableSchema}
            rows={rowsSorted}
            sortOrder={sortOrder}
            onUpdateSortOrder={(sortOrder) => {
              setSortOrder(sortOrder);
            }}
            onEditTitle={(name) => {
              setTitle(name);
              if (!!widgetPayload) {
                const payload: IFrameToWidgetMessage = {
                  type: "RENAME_TABLE",
                  closeIframe: false,
                  name,
                };
                parent?.postMessage({ pluginMessage: payload }, "*");
              } else {
                console.log({ name });
              }
            }}
            onShowSidecar={() => setShowSidecar(true)}
            onDeleteRow={(rowId) => {
              setRows(rows.filter((row) => row.rowId !== rowId));
              if (widgetPayload) {
                const payload: IFrameToWidgetMessage = {
                  type: "DELETE_ROW",
                  closeIframe: false,
                  row: { rowId },
                };
                parent?.postMessage({ pluginMessage: payload }, "*");
              } else {
                console.log("onDelete", rowId);
              }
            }}
            onRowReorder={({ rowId, afterRowId, beforeRowId }) => {
              const newRowId = fractionalIndex(beforeRowId, afterRowId);
              const rowById: Record<TRow["rowId"], TRow> = {};
              rows.forEach((r) => {
                if (r.rowId === rowId) {
                  rowById[newRowId] = { ...r, rowId: newRowId };
                } else {
                  rowById[r.rowId] = r;
                }
              });

              const rowIds = rows.map((r) =>
                r.rowId === rowId ? newRowId : r.rowId
              );
              rowIds.splice(rowIds.indexOf(newRowId), 1);
              if (afterRowId) {
                rowIds.splice(rowIds.indexOf(afterRowId), 0, newRowId);
              } else {
                rowIds.push(newRowId);
              }
              setRows(rowIds.map((x) => rowById[x]));
              if (widgetPayload) {
                const payload: IFrameToWidgetMessage = {
                  type: "REORDER_ROW",
                  rowId,
                  newRowId,
                };
                parent?.postMessage({ pluginMessage: payload }, "*");
              } else {
                console.log({
                  rowId: rowId,
                  newRowId,
                  afterRowId,
                  beforeRowId,
                });
              }
            }}
            onAppendRow={() => {
              const newRowId = fractionalIndex(
                rows.length !== 0 ? rows[rows.length - 1].rowId : "a0",
                null
              );
              setRows([...rows, { rowId: newRowId, rowData: {} }]);
              if (!!widgetPayload) {
                const payload: IFrameToWidgetMessage = {
                  type: "UPSERT_ROW",
                  closeIframe: false,
                  row: { rowId: newRowId, rowData: {} },
                };
                parent?.postMessage({ pluginMessage: payload }, "*");
              }
              return newRowId;
            }}
            onRowEdit={(rowId, v) => {
              setRows((rows) => {
                return rows.map((r) =>
                  r.rowId === rowId ? { rowId, rowData: v } : r
                );
              });
              if (widgetPayload) {
                const payload: IFrameToWidgetMessage = {
                  type: "UPSERT_ROW",
                  closeIframe: false,
                  row: {
                    rowId,
                    rowData: v,
                  },
                };
                parent?.postMessage({ pluginMessage: payload }, "*");
              } else {
                console.log({ onRowEdit: v });
              }
            }}
          />
          {showSidecar && (
            <>
              <SidecarOverlay onClick={() => setShowSidecar(false)} />
              <Sidecar>
                <SchemaEditor
                  initialValues={{ fields: tableSchema }}
                  onSubmit={(v, closeIframe) => {
                    if (widgetPayload) {
                      const payload: IFrameToWidgetMessage = {
                        type: "UPDATE_SCHEMA",
                        closeIframe: false,
                        fields: v.fields,
                      };
                      parent?.postMessage({ pluginMessage: payload }, "*");
                    } else {
                      console.log({ schema: v });
                    }
                    setTableSchema(v.fields);
                    if (closeIframe) {
                      setShowSidecar(false);
                    }
                  }}
                />
              </Sidecar>
            </>
          )}
        </>
      );
    default:
      assertUnreachable(route);
  }
}

const themeName = widgetPayload?.table.theme || "green";
const theme = getTheme(themeName);

function App() {
  useEffect(() => {
    document.documentElement.style.setProperty("--colorPrimary", theme.PRIMARY);
    document.documentElement.style.setProperty("--colorLight", theme.LIGHT);
    document.documentElement.style.setProperty("--colorDark", theme.DARK);
  }, []);
  return (
    <ThemeContext.Provider value={themeName}>
      <div className={styles.App}>
        <AppPage route={getAppRoute()} />
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
