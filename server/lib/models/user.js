import mongoose from 'mongoose';
import { v4 } from 'uuid';

const userSchema = mongoose.Schema({
  email: {type: String, unique: true},
  password: {type: String},
  clients: {type: [String]},
  userId: {type: String, default: v4, unique: true},
  createdAt: {type: Date, default: Date.now},
});

const User =  mongoose.model('User', userSchema);

export default User;