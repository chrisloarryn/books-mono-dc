import mongoose, { Schema, Document } from 'mongoose';

export interface ILastSearch extends Document {
  term: string;
  createdAt: Date;
}

const LastSearchSchema = new Schema<ILastSearch>({
  term: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

export const LastSearch = mongoose.models.LastSearch || mongoose.model<ILastSearch>('LastSearch', LastSearchSchema);
