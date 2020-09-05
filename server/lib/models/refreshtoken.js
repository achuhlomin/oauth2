import mongoose from 'mongoose';
import { v4 } from 'uuid';

const refreshTokenSchema = mongoose.Schema({
  userId: {type: String},
  clientId: {type: String},
  token: {type: String, default: v4},
  consumed: {type: Boolean, default: false},
  createdAt: {type: Date, default: Date.now},
});

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;