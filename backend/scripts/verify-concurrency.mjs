import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-jwt-secret-at-least-32-characters-long";
process.env.REFRESH_TOKEN_PEPPER = process.env.REFRESH_TOKEN_PEPPER || "test-refresh-pepper-at-least-32-characters";

import mongoose from "mongoose";
import { MenuItem } from "../src/models/MenuItem.js";
import { Cart } from "../src/models/Cart.js";
import { RefreshToken } from "../src/models/RefreshToken.js";
import { rotateSession } from "../src/services/authService.js";
import { hashToken } from "../src/services/tokenService.js";

const checks = [];
const check = async (label, fn) => {
  try {
    await fn();
    checks.push(`  PASS  ${label}`);
  } catch (error) {
    checks.push(`  FAIL  ${label} -> ${error.message}`);
    process.exitCode = 1;
  }
};

// 1. Enforce integer PKR prices in MenuItem schema
await check("MenuItem price rejects fractional rupees", async () => {
  const badItem = new MenuItem({
    name: "Mutton Karahi",
    price: 1850.75,
    category: new mongoose.Types.ObjectId(),
  });
  const err = badItem.validateSync();
  assert.ok(err?.errors?.price, "Expected price validation error for 1850.75");
  assert.match(err.errors.price.message, /whole rupees/i);
});

await check("MenuItem price accepts whole rupees", async () => {
  const goodItem = new MenuItem({
    name: "Mutton Karahi",
    price: 1850,
    category: new mongoose.Types.ObjectId(),
  });
  const err = goodItem.validateSync();
  assert.equal(err, undefined);
});

// 2. Cart optimisticConcurrency enabled
await check("Cart schema has optimisticConcurrency enabled", async () => {
  assert.equal(Cart.schema.options.optimisticConcurrency, true);
});

// 3. RefreshToken schema has pending field defaulting to false
await check("RefreshToken schema defaults pending to false", async () => {
  const tokenDoc = new RefreshToken({
    user: new mongoose.Types.ObjectId(),
    tokenHash: "dummyhash",
    family: "dummyfamily",
    expiresAt: new Date(Date.now() + 10000),
  });
  assert.equal(tokenDoc.pending, false);
});

// 4. Concurrency Simulation for rotateSession
// The mocks below keep a real document store keyed by _id so that revokeFamily actually
// mutates the same records the claim/activate filters read. A mock that only flips a
// boolean would hide a family revocation stripping `pending` from a live successor.
await check("Concurrent refresh: winner keeps the session and only the loser fails", async () => {
  const testFamily = "fam-123";
  const rawToken = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const tokenHash = hashToken(rawToken);
  const userId = new mongoose.Types.ObjectId();

  const store = new Map();
  const parentId = new mongoose.Types.ObjectId();
  store.set(String(parentId), {
    _id: parentId,
    user: userId,
    tokenHash,
    family: testFamily,
    expiresAt: new Date(Date.now() + 60000),
    revokedAt: null,
    pending: false,
  });
  let familyRevoked = false;

  const originalUserFindById = mongoose.models.User.findById;
  mongoose.models.User.findById = async () => ({ _id: userId, email: "test@ghalib.test", role: "customer" });

  const originalFindOne = RefreshToken.findOne;
  const originalCreate = RefreshToken.create;
  const originalFindOneAndUpdate = RefreshToken.findOneAndUpdate;
  const originalUpdateOne = RefreshToken.updateOne;
  const originalUpdateMany = RefreshToken.updateMany;
  const originalDeleteOne = RefreshToken.deleteOne;

  RefreshToken.findOne = async (filter) =>
    [...store.values()].find((doc) => doc.tokenHash === filter.tokenHash) || null;

  RefreshToken.create = async (doc) => {
    const _id = new mongoose.Types.ObjectId();
    const record = { _id, ...doc };
    store.set(String(_id), record);
    return record;
  };

  // Emulates Mongo's atomic find-and-update: the filter is re-evaluated against live state.
  RefreshToken.findOneAndUpdate = async (filter, update) => {
    const doc = store.get(String(filter._id));
    if (!doc) return null;
    if (doc.tokenHash !== filter.tokenHash) return null;
    if (doc.revokedAt !== null) return null;
    if (doc.pending === true) return null;
    if (!(doc.expiresAt > filter.expiresAt.$gt)) return null;
    Object.assign(doc, update.$set);
    return doc;
  };

  RefreshToken.updateOne = async (filter, update) => {
    const doc = store.get(String(filter._id));
    if (!doc || doc.pending !== filter.pending) return { modifiedCount: 0 };
    Object.assign(doc, update.$set);
    return { modifiedCount: 1 };
  };

  RefreshToken.updateMany = async (filter, update) => {
    let modifiedCount = 0;
    for (const doc of store.values()) {
      if (doc.family === filter.family) {
        Object.assign(doc, update.$set);
        modifiedCount++;
      }
    }
    if (filter.family === testFamily && modifiedCount) familyRevoked = true;
    return { modifiedCount };
  };

  RefreshToken.deleteOne = async (filter) => {
    const doc = store.get(String(filter._id));
    if (!doc || doc.pending !== filter.pending) return { deletedCount: 0 };
    store.delete(String(filter._id));
    return { deletedCount: 1 };
  };

  try {
    // Execute two simultaneous rotations with the identical raw token
    const results = await Promise.allSettled([
      rotateSession(rawToken, "agent-1"),
      rotateSession(rawToken, "agent-2"),
    ]);

    const successes = results.filter((r) => r.status === "fulfilled");
    const rejections = results.filter((r) => r.status === "rejected");

    assert.equal(successes.length, 1, "Exactly one rotation should succeed");
    assert.equal(rejections.length, 1, "Exactly one rotation should fail");
    assert.equal(rejections[0].reason.status, 401, "Failed rotation should return 401");

    // Losing a claim race is not a replay: the winner's new token must stay usable.
    assert.equal(familyRevoked, false, "A concurrent claim must not revoke the family");
    const issued = successes[0].value.refreshToken;
    const survivor = [...store.values()].find((doc) => doc.tokenHash === hashToken(issued));
    assert.ok(survivor, "Winner's successor token must exist");
    assert.equal(survivor.pending, false, "Winner's successor must be activated");
    assert.equal(survivor.revokedAt, null, "Winner's successor must not be revoked");

    // The loser must not leave an orphaned pending successor behind.
    const orphans = [...store.values()].filter((doc) => doc.pending === true);
    assert.equal(orphans.length, 0, "No pending successor should be left behind");
  } finally {
    // Restore originals
    mongoose.models.User.findById = originalUserFindById;
    RefreshToken.findOne = originalFindOne;
    RefreshToken.create = originalCreate;
    RefreshToken.findOneAndUpdate = originalFindOneAndUpdate;
    RefreshToken.updateOne = originalUpdateOne;
    RefreshToken.updateMany = originalUpdateMany;
    RefreshToken.deleteOne = originalDeleteOne;
  }
});

// 4b. A genuine replay of an already-rotated token must still revoke the whole family.
await check("Replay of a rotated token revokes the family", async () => {
  const testFamily = "fam-789";
  const rawToken = "abcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabcabca";
  let familyRevoked = false;

  const originalFindOne = RefreshToken.findOne;
  const originalUpdateMany = RefreshToken.updateMany;

  // Already rotated: revokedAt is set, which is what distinguishes replay from a race.
  RefreshToken.findOne = async () => ({
    _id: new mongoose.Types.ObjectId(),
    user: new mongoose.Types.ObjectId(),
    tokenHash: hashToken(rawToken),
    family: testFamily,
    expiresAt: new Date(Date.now() + 60000),
    revokedAt: new Date(),
    pending: false,
  });
  RefreshToken.updateMany = async (filter) => {
    if (filter.family === testFamily) familyRevoked = true;
    return { modifiedCount: 2 };
  };

  try {
    let error;
    try {
      await rotateSession(rawToken, "agent-replay");
    } catch (err) {
      error = err;
    }
    assert.ok(error, "Replay must be rejected");
    assert.equal(error.status, 401);
    assert.equal(familyRevoked, true, "Replay must revoke the family");
  } finally {
    RefreshToken.findOne = originalFindOne;
    RefreshToken.updateMany = originalUpdateMany;
  }
});

// 5. Activation failure safety
await check("Activation failure revokes family and fails safely", async () => {
  const testFamily = "fam-456";
  const rawToken = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";
  const tokenHash = hashToken(rawToken);
  const userId = new mongoose.Types.ObjectId();

  let familyRevoked = false;

  const originalUserFindById = mongoose.models.User.findById;
  mongoose.models.User.findById = async () => ({ _id: userId, email: "test@ghalib.test", role: "customer" });

  const originalFindOne = RefreshToken.findOne;
  const originalCreate = RefreshToken.create;
  const originalFindOneAndUpdate = RefreshToken.findOneAndUpdate;
  const originalUpdateOne = RefreshToken.updateOne;
  const originalUpdateMany = RefreshToken.updateMany;

  RefreshToken.findOne = async () => ({
    _id: new mongoose.Types.ObjectId(),
    user: userId,
    tokenHash,
    family: testFamily,
    expiresAt: new Date(Date.now() + 60000),
    revokedAt: null,
    pending: false,
  });
  RefreshToken.create = async (doc) => ({ _id: new mongoose.Types.ObjectId(), ...doc });
  RefreshToken.findOneAndUpdate = async (query) => ({ _id: query._id, revokedAt: new Date() });
  // Simulate activation failure (e.g. race condition or db issue)
  RefreshToken.updateOne = async () => ({ modifiedCount: 0 });
  RefreshToken.updateMany = async (filter) => {
    if (filter.family === testFamily) familyRevoked = true;
    return { modifiedCount: 1 };
  };

  try {
    let error;
    try {
      await rotateSession(rawToken, "agent-fail");
    } catch (err) {
      error = err;
    }
    assert.ok(error, "Expected rotateSession to throw on activation failure");
    assert.equal(error.status, 401);
    assert.equal(familyRevoked, true, "Family must be revoked when activation fails");
  } finally {
    mongoose.models.User.findById = originalUserFindById;
    RefreshToken.findOne = originalFindOne;
    RefreshToken.create = originalCreate;
    RefreshToken.findOneAndUpdate = originalFindOneAndUpdate;
    RefreshToken.updateOne = originalUpdateOne;
    RefreshToken.updateMany = originalUpdateMany;
  }
});

console.log(checks.join("\n"));
