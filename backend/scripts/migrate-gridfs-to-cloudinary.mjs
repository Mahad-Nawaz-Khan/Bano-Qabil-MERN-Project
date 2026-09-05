import "dotenv/config";
import { GridFSBucket } from "mongodb";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/db.js";
import { MenuItem } from "../src/models/MenuItem.js";
import { uploadMenuImage } from "../src/services/cloudinaryService.js";

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

try {
  await connectDatabase();
  const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "menu_assets" });
  const files = await mongoose.connection.db.collection("menu_assets.files").find().toArray();
  let migrated = 0;
  let linkedItems = 0;

  for (const file of files) {
    const buffer = await streamToBuffer(bucket.openDownloadStream(file._id));
    const uploaded = await uploadMenuImage(buffer, {
      filename: file.filename,
      folder: "ghalib-restaurant/menu-migrated",
    });
    const oldUrl = `/api/assets/${encodeURIComponent(file.filename)}`;
    const result = await MenuItem.updateMany({ image: oldUrl }, { $set: { image: uploaded.secure_url } });
    migrated += 1;
    linkedItems += result.modifiedCount;
    console.log(`Migrated ${file.filename}`);
  }

  console.log(`Migration complete: ${migrated} GridFS images uploaded; ${linkedItems} menu items now use Cloudinary URLs.`);
  console.log("GridFS files were kept. Verify the menu first, then delete menu_assets.files and menu_assets.chunks manually if desired.");
} catch (error) {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
