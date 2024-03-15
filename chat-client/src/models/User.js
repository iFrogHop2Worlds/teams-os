import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    password: { type: String, required: true },
    password: { type: String, required: false },
    isAdmin: { type: Boolean, required: false, default: false },
  },
  {
    timestamps: true,
  }
);

const Users = mongoose.models.Users || mongoose.model('Users', userSchema);
export default Users;