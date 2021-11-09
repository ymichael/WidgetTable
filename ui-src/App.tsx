import * as React from "react";
import styles from "./App.module.css";

import SchemaEditor from "./SchemaEditor";
import RowEditor from "./RowEditor";

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

const tableSchema: Table["fields"] = !!widgetPayload
  ? widgetPayload.fields
  : TEST_TABLE_SCHEMA;
const rowData =
  widgetPayload?.type === "EDIT_ROW" ? widgetPayload.row.rowData : {};

console.log(tableSchema);

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
      ) : (
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
      )}
    </div>
  );
}

export default App;
