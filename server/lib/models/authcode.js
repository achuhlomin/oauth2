import mongoose from 'mongoose';
import { v4 } from 'uuid';

const authCodeSchema = mongoose.Schema({
  clientId: {type: String},
  userId: {type: String},
  code: {type: String, default: v4},
  consumed: {type: Boolean, default: false},
  redirectUri: {type: String},
  createdAt: {type: Date, default: Date.now, expires: '10m'}, // A maximum authorization code lifetime of 10 minutes is RECOMMENDED. It should be a short-lived token
});

const AuthCode = mongoose.model('AuthCode', authCodeSchema);

export default AuthCode;