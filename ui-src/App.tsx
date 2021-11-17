import * as React from "react";
import { useState, useEffect } from "react";
import styles from "./App.module.css";

import SchemaEditor from "./SchemaEditor";
import RowEditor from "./RowEditor";
import Table from "./Table";
import { Sidecar, SidecarOverlay } from "./Sidecar";

import {
  TRow,
  TableField,
  WidgetToIFrameShowUIMessage,
  WidgetToIFramePostMessage,
  IFrameToWidgetMessage,
} from "../shared/types";
import fractionalIndex from "../shared/fractional-indexing";
import { assertUnreachable } from "../shared/utils";
import { getAppRoute, AppRoute, RouteType } from "./router";

const widgetPayload: WidgetToIFrameShowUIMessage | undefined = (window as any)
  .widgetPayload;

function AppPage({ route }: { route: AppRoute }) {
  const [rows, setRows] = useState<TRow[]>(
    route.type === RouteType.FULL_TABLE ? route.rows : []
  );
  const [title, setTitle] = useState<string>(route.title);
  const [tableSchema, setTableSchema] = useState<TableField[]>(
    route.tableSchema
  );
  const [showSidecar, setShowSidecar] = useState<boolean>(false);

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
      if (evt.type === "UPDATE_ROW_ORDER") {
        const { orderedRowIds, updatedRowIds } = evt;
        if (widgetPayload.type === "FULL_TABLE") {
          const rowById: { [id: TRow["rowId"]]: TRow } = {};
          rows.forEach((existingRow) => {
            // Try not to mutate existing rows as much as possible.
            if (updatedRowIds[existingRow.rowId]) {
              existingRow.rowId = updatedRowIds[existingRow.rowId];
            }
            rowById[existingRow.rowId] = existingRow;
          });
          setRows(orderedRowIds.map((rowId) => rowById[rowId]));
        }
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
            rows={rows}
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
              if (widgetPayload) {
                const payload: IFrameToWidgetMessage = {
                  type: "DELETE_ROW",
                  closeIframe: false,
                  row: { rowId },
                };
                parent?.postMessage({ pluginMessage: payload }, "*");
              } else {
                setRows(rows.filter((row) => row.rowId !== rowId));
                console.log("onDelete", rowId);
              }
            }}
            onRowReorder={({ rowId, afterRowId, beforeRowId }) => {
              if (widgetPayload) {
                const payload: IFrameToWidgetMessage = {
                  type: "REORDER_ROW",
                  rowId,
                  afterRowId,
                  beforeRowId,
                };
                parent?.postMessage({ pluginMessage: payload }, "*");
              } else {
                console.log({ rowId: rowId, afterRowId, beforeRowId });
              }
            }}
            onAppendRow={() => {
              const newRowId = fractionalIndex(
                rows[rows.length - 1].rowId || "a0",
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
                        closeIframe,
                        fields: v.fields,
                      };
                      parent?.postMessage({ pluginMessage: payload }, "*");
                    } else {
                      console.log({ schema: v, closeIframe });
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

function App() {
  return (
    <div className={styles.App}>
      <AppPage route={getAppRoute()} />
    </div>
  );
}

export default App;
