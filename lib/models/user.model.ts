import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  // --- Core Identity (From Clerk) ---
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String },
  lastName: { type: String },
  photo: { type: String },

  // Add this inside your UserSchema definition
  role: {
    type: String,
    enum: ["passenger", "driver", "both", "none"],
    default: "none", // Defaults to 'none' so we know to show them the onboarding screen!
  },
  
  // --- Profile Details ---
  phone: { type: String, default: "" },
  bio: { type: String, default: "" },
  university: { type: String, default: "CUST" },
  department: { type: String, default: "CS" },
  
  // --- App Statistics ---
  ridesTaken: { type: Number, default: 0 },
  ridesOffered: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0 }, // Start everyone with a 5-star rating!

  // --- Driver Verification & Vehicle ---
  driverLicenseImage: { type: String, default: "" },
  vehiclePicture: { type: String, default: "" },
  vehicleInfo: { 
    make: { type: String, default: "" },
    model: { type: String, default: "" },
    color: { type: String, default: "" },
    year: { type: Number, default: 2000 },
    LicensePlate: { type: String, default: "" }
  },
  isDriverVerified: { type: Boolean, default: false },
  savedPlaces: [
    {
      name: { type: String, required: true }, // e.g., "Home", "University", "Gym"
      address: { type: String, required: true }, // e.g., "123 Main St"
      lat: { type: Number },
      lng: { type: Number },
      icon: { type: String, default: "map-pin" } // So we can show a 🏠 or 🎓 icon!
    }
  ],
});

// If the model already exists, use it. Otherwise, create a new one.
const User = models.User || model("User", UserSchema);

export default User;