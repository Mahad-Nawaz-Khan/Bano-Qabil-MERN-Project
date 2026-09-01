import { Router } from "express";
import { GridFSBucket } from "mongodb";
import mongoose from "mongoose";

export const assetRouter = Router();

assetRouter.get("/:filename", async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const files = mongoose.connection.db.collection("menu_assets.files");
    const file = await files.findOne({ filename });
    if (!file) return res.status(404).json({ message: "Asset not found" });

    res.set({
      "Content-Type": file.metadata?.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    });
    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "menu_assets" });
    bucket.openDownloadStreamByName(filename).on("error", next).pipe(res);
  } catch (error) {
    next(error);
  }
});
