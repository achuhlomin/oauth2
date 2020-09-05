import mongoose from 'mongoose';
import { v4 } from 'uuid';

const clientSchema = mongoose.Schema({
  clientId: {type: String, default: v4, unique: true},
  clientSecret: {type: String, default: v4, unique: true},
  name: {type: String, unique: true},
  scope: {type: String},
  redirectUri: {type: String},
  createdAt: {type: Date, default: Date.now},
});

const Client = mongoose.model('Client', clientSchema);

export default Client;