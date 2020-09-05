import mongoose from 'mongoose';
import { v4 } from 'uuid';

const idTokenSchema = mongoose.Schema({
  iat: {type: String, default: () => Math.floor(new Date() / 1000)},
  exp: {type: String, default: () => Math.floor(new Date() / 1000) + 180},
  sub: {type: String, default: v4, maxlength: 255},
  iss: {type: String},
  aud: {type: String},
  email: {type: String},
  createdAt: {type: Date, default: Date.now, expires: '3m'},
});

const IdToken = mongoose.model('IdToken', idTokenSchema);

export default IdToken;