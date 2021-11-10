import { TableField } from "../shared/types";
import { TRow } from "../shared/types";
import fractionalIndex from "./fractional-indexing";

export default class SyncedTable {
  ROW_AUTO_INCR_KEY = "row-auto-incr-key";
  TABLE_TITLE_KEY = "table-title-key";

  constructor(
    private schema: TableField[],
    private metadata: SyncedMap<any>,
    private rows: SyncedMap<TRow["rowData"]>,
    private votes: SyncedMap<boolean>
  ) {}

  private genRowId(): number {
    const currKey = this.metadata.get(this.ROW_AUTO_INCR_KEY) || "a0";
    const nextRowId = fractionalIndex(String(currKey), null);
    this.metadata.set(this.ROW_AUTO_INCR_KEY, nextRowId);
    return nextRowId;
  }

  getTitle(): string {
    return this.metadata.get(this.TABLE_TITLE_KEY) || "";
  }

  setTitle(name: string): void {
    this.metadata.set(this.TABLE_TITLE_KEY, name);
  }

  appendRow(rowData: TRow["rowData"]): void {
    this.rows.set(`${this.genRowId()}`, rowData);
  }

  updateRow(rowId: string, rowData: TRow["rowData"]): void {
    this.rows.set(rowId, rowData);
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

  getRows(): [string, TRow["rowData"]][] {
    const votesMap = this.getVotesMap();
    const rowKeys = this.rows.keys();
    rowKeys.sort();
    return rowKeys.map((k) => {
      const rowData = {
        ...this.rows.get(k),
        ...votesMap[k],
      };
      return [k, rowData];
    });
  }
}
