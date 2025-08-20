import mongoose, { Schema, Document } from 'mongoose';

export interface ILibraryBook extends Document {
  workKey?: string; // e.g. /works/OL12345W
  title: string;
  authors: string[];
  year?: number;
  coverBase64: string; // raw base64 without data URI
  coverMimeType: string; // e.g. image/jpeg
  review?: string; // <= 500 chars
  rating?: number; // 1..5
  createdAt: Date;
  updatedAt: Date;
}

const LibraryBookSchema = new Schema<ILibraryBook>(
  {
    workKey: { type: String, index: true },
    title: { type: String, required: true, index: true },
    authors: { type: [String], default: [], index: true },
    year: { type: Number },
    coverBase64: { type: String, required: true },
    coverMimeType: { type: String, default: 'image/jpeg' },
    review: { type: String, maxlength: 500, default: '' },
    rating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

export const LibraryBook = mongoose.models.LibraryBook || mongoose.model<ILibraryBook>('LibraryBook', LibraryBookSchema);
