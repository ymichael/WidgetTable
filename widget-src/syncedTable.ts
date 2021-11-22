import { FieldType, TableField } from "../shared/types";
import { TRow } from "../shared/types";
import fractionalIndex from "../shared/fractional-indexing";

export default class SyncedTable {
  ROW_AUTO_INCR_KEY = "row-auto-incr-key";
  TABLE_TITLE_KEY = "table-title-key";
  TABLE_SCHEMA_KEY = "table-schema-key";
  TABLE_THEME_KEY = "table-theme-key";

  // Used to track if there are any changes to rows / schema
  // to update iframe with row changes.
  ROWS_VERSION_KEY = "rows-version-key";
  SCHEMA_VERSION_KEY = "schema-version-key";

  private nonVoteFieldIds: Set<string>;

  constructor(
    private metadata: SyncedMap<any>,
    private rows: SyncedMap<TRow["rowData"]>,
    private votes: SyncedMap<boolean>
  ) {
    this.updateNonVoteFieldIds();
  }

  private genRowId(): string {
    const currKey = this.metadata.get(this.ROW_AUTO_INCR_KEY) || "a0";
    const nextRowId = fractionalIndex(String(currKey), null);
    this.metadata.set(this.ROW_AUTO_INCR_KEY, nextRowId);
    return nextRowId;
  }

  private updateNonVoteFieldIds(): void {
    this.nonVoteFieldIds = new Set(
      this.schema
        .filter((f) => f.fieldType !== FieldType.VOTE)
        .map((f) => f.fieldId)
    );
  }

  forceRerender(): void {
    this.metadata.set(this.ROWS_VERSION_KEY, this.rowsVersion);
  }

  get rowsVersion(): number {
    return this.metadata.get(this.ROWS_VERSION_KEY) || 0;
  }

  get theme(): string {
    return this.metadata.get(this.TABLE_THEME_KEY);
  }

  setTheme(theme: string): void {
    return this.metadata.set(this.TABLE_THEME_KEY, theme);
  }

  private dirtyRows(): void {
    this.metadata.set(this.ROWS_VERSION_KEY, this.rowsVersion + 1);
  }

  get schemaVersion(): number {
    return this.metadata.get(this.SCHEMA_VERSION_KEY) || 0;
  }

  get schema(): TableField[] {
    return this.metadata.get(this.TABLE_SCHEMA_KEY) || [];
  }

  setSchema(schema: TableField[]): void {
    this.metadata.set(this.TABLE_SCHEMA_KEY, schema);
    this.metadata.set(this.SCHEMA_VERSION_KEY, this.schemaVersion + 1);
    this.updateNonVoteFieldIds();
  }

  getTitle(): string {
    return this.metadata.get(this.TABLE_TITLE_KEY) || "";
  }

  setTitle(name: string): void {
    this.metadata.set(this.TABLE_TITLE_KEY, name);
  }

  deleteAllRows(): void {
    this.rows.keys().forEach((k) => this.rows.delete(k));
  }

  sanitizeRow(rowData: TRow["rowData"]): TRow["rowData"] {
    const ret: TRow["rowData"] = {};
    Object.keys(rowData).forEach((k) => {
      if (this.nonVoteFieldIds.has(k)) {
        ret[k] = rowData[k];
      }
    });
    return ret;
  }

  appendRow(rowData: TRow["rowData"]): void {
    this.rows.set(`${this.genRowId()}`, this.sanitizeRow(rowData));
    this.dirtyRows();
  }

  updateRow(rowId: string, rowData: TRow["rowData"]): void {
    this.rows.set(rowId, this.sanitizeRow(rowData));
    this.dirtyRows();
  }

  moveRow(rowId: string, newRowId: string): string | null {
    const oldRowId = rowId;
    const row = this.rows.get(rowId);
    if (!row) {
      console.error(`Attempting to re-order non-existent rowId: ${rowId}`);
      return null;
    }

    // TODO what happens if rows are re-ordered while voting
    this.rows.delete(oldRowId);
    this.rows.set(newRowId, row);
    this.dirtyRows();
    this.votes.keys().forEach((voteKey) => {
      const { rowId, fieldId, userId } = this.fromVoteKey(voteKey);
      if (rowId === oldRowId) {
        this.votes.delete(voteKey);
        this.toggleVote({ rowId: newRowId, fieldId, userId });
      }
    });
    return newRowId;
  }

  deleteRow(rowId: string): void {
    this.rows.delete(rowId);
    this.dirtyRows();
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
    this.dirtyRows();
  }

  toggleVote(args: { rowId: string; fieldId: string; userId: string }): void {
    const voteKey = this.toVoteKey(args);
    if (this.votes.get(voteKey)) {
      this.votes.delete(voteKey);
    } else {
      this.votes.set(voteKey, true);
    }
    this.dirtyRows();
  }

  getRowIdsOrdered(): TRow["rowId"][] {
    const rowKeys = this.rows.keys();
    rowKeys.sort();
    return rowKeys;
  }

  getRows(): [string, TRow["rowData"]][] {
    const votesMap = this.getVotesMap();
    const rowKeys = this.getRowIdsOrdered();
    return rowKeys.map((k) => {
      const rowData = {
        ...this.rows.get(k),
        ...votesMap[k],
      };
      return [k, rowData];
    });
  }
}
