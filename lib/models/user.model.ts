import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String },
  lastName: { type: String },
  photo: { type: String },
  
  // UniRide specific fields we saw in your frontend code
  driverLicenseImage: { type: String, default: "" },
  vehiclePicture: { type: String, default: "" },
  vehicleInfo: { 
    make: { type: String, default: "" },
    model: { type: String, default: "" },
    color: { type: String, default: "" }
  },
  isDriverVerified: { type: Boolean, default: false }
});

// If the model already exists, use it. Otherwise, create a new one.
const User = models.User || model("User", UserSchema);

export default User;