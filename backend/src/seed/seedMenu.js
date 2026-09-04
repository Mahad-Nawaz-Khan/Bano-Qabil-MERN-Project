import "dotenv/config";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { GridFSBucket } from "mongodb";
import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import { Category } from "../models/Category.js";
import { MenuItem } from "../models/MenuItem.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const assetsPath = path.join(root, "src", "assets");
const menuDataPath = path.join(root, "src", "data", "menuData.js");
const supportedExtensions = new Map([
  [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"], [".png", "image/png"], [".webp", "image/webp"],
]);

async function getMenuData() {
  const source = await fs.readFile(menuDataPath, "utf8");
  const expression = source.replace(/^[\s\S]*?export\s+const\s+menuData\s*=\s*/, "").replace(/;\s*$/, "");
  return new Function(`return (${expression})`)();
}

async function uploadAssets() {
  const assetNames = (await fs.readdir(assetsPath)).filter((name) => supportedExtensions.has(path.extname(name).toLowerCase()));
  const files = mongoose.connection.db.collection("menu_assets.files");
  const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "menu_assets" });
  let uploaded = 0;
  for (const filename of assetNames) {
    if (await files.findOne({ filename })) continue;
    const contentType = supportedExtensions.get(path.extname(filename).toLowerCase());
    await pipeline(createReadStream(path.join(assetsPath, filename)), bucket.openUploadStream(filename, { metadata: { contentType } }));
    uploaded += 1;
  }
  return { total: assetNames.length, uploaded };
}

async function seedMenu() {
  const menu = await getMenuData();
  let categoryCount = 0;
  let itemCount = 0;
  for (const [sortOrder, section] of menu.entries()) {
    let category = await Category.findOne({ name: section.category });
    if (!category) {
      category = await Category.create({ name: section.category, sortOrder });
      categoryCount += 1;
    } else if (category.sortOrder !== sortOrder) {
      // Re-seeding keeps categories ordered as authored in menuData.
      category.sortOrder = sortOrder;
      await category.save();
    }
    for (const item of section.items) {
      const filename = path.basename(item.img);
      await MenuItem.findOneAndUpdate(
        { name: item.name, category: category._id },
        { name: item.name, description: item.desc || "", price: Number(String(item.price).replace(/[^\d.]/g, "")) || 0, category: category._id, image: `/api/assets/${encodeURIComponent(filename)}`, isAvailable: true },
        { upsert: true, new: true, runValidators: true },
      );
      itemCount += 1;
    }
  }
  return { categoryCount, itemCount };
}

try {
  await connectDatabase();
  const assets = await uploadAssets();
  const menu = await seedMenu();
  console.log(`Seed complete: ${assets.uploaded} new assets (${assets.total} total), ${menu.categoryCount} new categories, ${menu.itemCount} menu items upserted.`);
} catch (error) {
  console.error(`Seed failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
