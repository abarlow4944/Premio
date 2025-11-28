-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utorid" TEXT,
    "type" TEXT NOT NULL DEFAULT 'purchase',
    "spent" REAL,
    "remark" TEXT,
    "amount" INTEGER,
    "relatedId" INTEGER,
    "createdBy" TEXT,
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "processed" BOOLEAN NOT NULL,
    "processedBy" TEXT,
    "eventId" INTEGER,
    CONSTRAINT "Transaction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "createdBy", "eventId", "id", "processed", "processedBy", "relatedId", "remark", "spent", "suspicious", "type", "utorid") SELECT "amount", "createdBy", "eventId", "id", "processed", "processedBy", "relatedId", "remark", "spent", "suspicious", "type", "utorid" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utorid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'regular',
    "verified" BOOLEAN,
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "suspicious" BOOLEAN DEFAULT false,
    "birthday" TEXT,
    "avatarUrl" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" DATETIME,
    "points" INTEGER NOT NULL DEFAULT 0,
    "qrToken" TEXT
);
INSERT INTO "new_User" ("activated", "avatarUrl", "birthday", "createdAt", "email", "id", "lastLogin", "name", "password", "points", "qrToken", "role", "suspicious", "utorid", "verified") SELECT coalesce("activated", false) AS "activated", "avatarUrl", "birthday", "createdAt", "email", "id", "lastLogin", "name", "password", "points", "qrToken", "role", "suspicious", "utorid", "verified" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_utorid_key" ON "User"("utorid");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_qrToken_key" ON "User"("qrToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
