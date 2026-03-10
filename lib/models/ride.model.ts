import { Schema, model, models } from "mongoose";

const RideSchema = new Schema({
  // 1. Driver Link
  driver: { type: Schema.Types.ObjectId, ref: "User", required: true },
  
  // 2. Locations (Names and exact GPS Coordinates)
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  originCoords: { 
    lat: { type: Number, required: true }, 
    lng: { type: Number, required: true } 
  },
  destinationCoords: { 
    lat: { type: Number, required: true }, 
    lng: { type: Number, required: true } 
  },
  
  // 3. Scheduling
  date: { type: String, required: true }, // e.g., "2024-10-25"
  time: { type: String, required: true }, // e.g., "14:30"
  departureTime: { type: Date, required: true }, // Combined Date object for easy MongoDB sorting
  
  // 4. Ride Specs
  totalSeats: { type: Number, required: true },
  availableSeats: { type: Number, required: true },
  price: { type: Number, required: true },
  uniOnly: { type: Boolean, default: true },
  
  // 5. Passengers & Lifecycle
  passengers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  status: { 
    type: String, 
    enum: ["scheduled", "active", "completed", "cancelled"], 
    default: "scheduled" 
  }
}, { timestamps: true });

const Ride = models.Ride || model("Ride", RideSchema);

export default Ride;