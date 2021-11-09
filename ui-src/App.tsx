import * as React from "react";
import styles from "./App.module.css";

import SchemaEditor from "./SchemaEditor";
import RowEditor from "./RowEditor";

import { Table, FieldType, WidgetToIFrameMessage } from "../shared/types";

const TEST_TABLE: Table = {
  name: "Untitled",
  fields: [
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
  ],
};

const TEST_DATA = {
  title: "Hello Widgets",
  published: true,
};

const widgetPayload: WidgetToIFrameMessage | undefined = (window as any)
  .widgetPayload;
const showSchemaEditor = !!widgetPayload
  ? widgetPayload.type === "EDIT_SCHEMA"
  : /schema=1/.test(window.location.search);

const schema: Pick<Table, "fields"> =
  widgetPayload?.type === "EDIT_SCHEMA" ? widgetPayload.table : TEST_TABLE;

function App() {
  return (
    <div className={styles.App}>
      {showSchemaEditor ? (
        <SchemaEditor
          initialValues={schema}
          onSubmit={(v) => {
            console.log({ v });
          }}
        />
      ) : (
        <RowEditor tableSchema={TEST_TABLE.fields} initialValues={TEST_DATA} />
      )}
    </div>
  );
}

export default App;
