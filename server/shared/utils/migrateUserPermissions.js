import mongoose from "mongoose";

/**
 * Idempotent migration: promotes existing users from the old flat `level: Number`
 * field to the new `permissions` matrix + `isActive` flag.
 *
 * Old → New mapping (old system: lower number = higher authority):
 *   level 1 (ADMIN)                → permissions.operations: 3
 *   level 2 (PROJECT_ENGINEER)     → permissions.operations: 2
 *   level 3 (PRODUCTION_SUPERVISOR)→ permissions.operations: 1
 *   level 4 (FIELD_USER)           → permissions.operations: 1
 *
 * NOTE: No user is automatically promoted to superAdmin: true.
 *       Designate a superAdmin manually in MongoDB Compass or via the
 *       Superadmin Dashboard (Phase 5).
 *
 * Safe to run multiple times — skips users that already have `permissions`.
 */
export const migrateUserPermissions = async () => {
  try {
    // Raw access via the underlying Mongoose collection to handle documents
    // that no longer match the new schema shape.
    const collection = mongoose.connection.collection("users");

    // Find users that still have the old `level` field (migration not yet applied)
    const legacyUsers = await collection
      .find({ level: { $exists: true } })
      .toArray();

    if (legacyUsers.length === 0) {
      return; // Already migrated — nothing to do
    }

    console.log(`[migration] Migrating ${legacyUsers.length} user(s) from level → permissions...`);

    const levelToOperations = (level) => {
      if (level === 1) return 3; // old Admin → new operations admin
      if (level === 2) return 2; // old Project Engineer → new operator
      return 1;                  // level 3 & 4 → viewer
    };

    let updatedCount = 0;

    for (const user of legacyUsers) {
      await collection.updateOne(
        { _id: user._id },
        {
          $set: {
            permissions: {
              operations: levelToOperations(user.level),
              finance: 0,
              superAdmin: false,
            },
            isActive: true,
          },
          $unset: { level: "" }, // Remove the legacy field entirely
        },
      );
      updatedCount++;
    }

    console.log(`[migration] User permissions migration complete — ${updatedCount} user(s) updated.`);
  } catch (error) {
    console.error("[migration] Error migrating user permissions:", error.message);
  }
};
