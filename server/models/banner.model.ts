import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBannerImage extends Document {
  public_id: string; // The objectName in MinIO
  bucket: string;
  width: number;  // ADD THIS
  height: number; // ADD THIS
}

const bannerImageSchema = new Schema<IBannerImage>({
  public_id: { type: String, required: true },
  bucket: { type: String, required: true },
  width: { type: Number, required: true },  // ADD THIS
  height: { type: Number, required: true }, // ADD THIS
}, { timestamps: true });

const BannerImageModel: Model<IBannerImage> = mongoose.model("BannerImage", bannerImageSchema);

export default BannerImageModel;