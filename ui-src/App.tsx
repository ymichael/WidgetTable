import * as React from "react";
import styles from "./App.module.css";

import SchemaEditor from "./SchemaEditor";
import RowEditor from "./RowEditor";
import TableNameEditor from "./TableNameEditor";

import {
  Table,
  FieldType,
  WidgetToIFrameMessage,
  IFrameToWidgetMessage,
} from "../shared/types";

const TEST_TABLE_SCHEMA: Table["fields"] = [
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
    fieldId: "published",
    fieldName: "Published",
    fieldType: FieldType.CHECKBOX,
  },
];

const widgetPayload: WidgetToIFrameMessage | undefined = (window as any)
  .widgetPayload;
const showSchemaEditor = !!widgetPayload
  ? widgetPayload.type === "EDIT_SCHEMA"
  : /schema=1/.test(window.location.search);
const showTitleEditor = !!widgetPayload
  ? widgetPayload.type === "RENAME_TABLE"
  : /title=1/.test(window.location.search);
const showRowEditor = !showSchemaEditor && !showTitleEditor;

const tableSchema: Table["fields"] = !!widgetPayload
  ? widgetPayload.fields
  : TEST_TABLE_SCHEMA;
const tableName =
  widgetPayload?.type === "RENAME_TABLE" ? widgetPayload.name : "";
const rowData =
  widgetPayload?.type === "EDIT_ROW" ? widgetPayload.row.rowData : {};

function App() {
  return (
    <div className={styles.App}>
      {showSchemaEditor ? (
        <SchemaEditor
          initialValues={{ fields: tableSchema }}
          onSubmit={(v) => {
            if (widgetPayload?.type === "EDIT_SCHEMA") {
              const payload: IFrameToWidgetMessage = {
                type: "UPDATE_SCHEMA",
                fields: v.fields,
              };
              parent?.postMessage({ pluginMessage: payload }, "*");
            } else {
              console.log({ schema: v });
            }
          }}
        />
      ) : showRowEditor ? (
        <RowEditor
          tableSchema={tableSchema}
          initialValues={rowData}
          isEdit={widgetPayload?.type === "EDIT_ROW"}
          onEdit={(v) => {
            if (widgetPayload?.type === "EDIT_ROW") {
              const payload: IFrameToWidgetMessage = {
                type: "EDIT_ROW",
                row: {
                  rowId: widgetPayload.row.rowId,
                  rowData: v,
                },
              };
              parent?.postMessage({ pluginMessage: payload }, "*");
            } else {
              console.log({ onEdit: v });
            }
          }}
          onDelete={() => {
            if (widgetPayload?.type === "EDIT_ROW") {
              const payload: IFrameToWidgetMessage = {
                type: "DELETE_ROW",
                row: {
                  rowId: widgetPayload.row.rowId,
                },
              };
              parent?.postMessage({ pluginMessage: payload }, "*");
            } else {
              console.log("onDelete");
            }
          }}
          onCreate={(v) => {
            if (!!widgetPayload) {
              const payload: IFrameToWidgetMessage = {
                type: "NEW_ROW",
                fromEdit: widgetPayload?.type === "EDIT_ROW",
                row: { rowData: v },
              };
              parent?.postMessage({ pluginMessage: payload }, "*");
            } else {
              console.log({ onCreate: v });
            }
          }}
        />
      ) : (
        <TableNameEditor
          name={tableName}
          onSubmit={({ name }) => {
            if (!!widgetPayload) {
              const payload: IFrameToWidgetMessage = {
                type: "RENAME_TABLE",
                name,
              };
              parent?.postMessage({ pluginMessage: payload }, "*");
            } else {
              console.log({ name });
            }
          }}
        />
      )}
    </div>
  );
}

export default App;
