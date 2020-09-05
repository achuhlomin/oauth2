import mongoose from 'mongoose';
import { v4 } from 'uuid';

const tokenSchema = mongoose.Schema({
  userId: {type: String},
  refreshToken: {type: String, unique: true},
  accessToken: {type: String, default: v4},
  expiresIn: {type: String, default: '60'}, // 1 min, it isn't checked in /lib/middleware/authorize.js, thanks to createdAt field
  tokenType: {type: String, default: 'Bearer'},
  count: {type: Number, default: 0},
  consumed: {type: Boolean, default: false},
  createdAt: {type: Date, default: Date.now, expires: '1m'}, // mongodb drops token after 1m
});

const Token = mongoose.model('Token', tokenSchema);

export default Token;

