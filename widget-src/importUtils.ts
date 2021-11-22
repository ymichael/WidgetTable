import SyncedTable from "./syncedTable";
import { STICKY_SCHEMA, STICKY_NO_AUTHOR_SCHEMA } from "./constants";

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

export function importStickiesOnPage(syncedTable: SyncedTable): void {
  const stickies = figma.currentPage.findChildren(isSticky) as StickyNode[];
  if (stickies.length === 0) {
    figma.notify("Could not find any stickies");
    return;
  }
  importStickies(syncedTable, stickies);
}

export function importSelectedStickiesOnPage(syncedTable: SyncedTable): void {
  const stickies: StickyNode[] = figma.currentPage.selection.filter(isSticky);
  if (stickies.length === 0) {
    figma.notify("Select stickies to import");
    return;
  }
  importStickies(syncedTable, stickies);
}
