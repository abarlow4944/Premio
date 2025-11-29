-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utorid" TEXT,
    "type" TEXT NOT NULL DEFAULT 'purchase',
    "spent" REAL,
    "remark" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "relatedId" INTEGER,
    "createdBy" TEXT,
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "processed" BOOLEAN NOT NULL,
    "processedBy" TEXT,
    "eventId" INTEGER,
    CONSTRAINT "Transaction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "createdBy", "eventId", "id", "processed", "processedBy", "relatedId", "remark", "spent", "suspicious", "type", "utorid") SELECT coalesce("amount", 0) AS "amount", "createdBy", "eventId", "id", "processed", "processedBy", "relatedId", "remark", "spent", "suspicious", "type", "utorid" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
