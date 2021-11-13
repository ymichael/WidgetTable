import { FieldType, TableField } from "../shared/types";
import { TRow } from "../shared/types";
import fractionalIndex from "../shared/fractional-indexing";

export default class SyncedTable {
  ROW_AUTO_INCR_KEY = "row-auto-incr-key";
  TABLE_TITLE_KEY = "table-title-key";
  TABLE_SCHEMA_KEY = "table-schema-key";

  private nonVoteFieldIds: Set<string>;

  constructor(
    private metadata: SyncedMap<any>,
    private rows: SyncedMap<TRow["rowData"]>,
    private votes: SyncedMap<boolean>
  ) {
    this.updateNonVoteFieldIds();
  }

  private genRowId(): number {
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

  get schema(): TableField[] {
    return this.metadata.get(this.TABLE_SCHEMA_KEY) || [];
  }

  setSchema(schema: TableField[]): void {
    this.metadata.set(this.TABLE_SCHEMA_KEY, schema);
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
  }

  updateRow(rowId: string, rowData: TRow["rowData"]): void {
    this.rows.set(rowId, this.sanitizeRow(rowData));
  }

  moveRow(
    rowId: string,
    beforeRowId: string | null,
    afterRowId: string | null
  ): string | null {
    const oldRowId = rowId;
    const row = this.rows.get(rowId);
    if (!row) {
      console.error(`Attempting to re-order non-existent rowId: ${rowId}`);
      return null;
    }
    const newRowId = fractionalIndex(beforeRowId, afterRowId);
    if (oldRowId === newRowId) {
      return null;
    }

    // TODO what happens if rows are re-ordered while voting
    this.rows.delete(oldRowId);
    this.rows.set(newRowId, row);
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
