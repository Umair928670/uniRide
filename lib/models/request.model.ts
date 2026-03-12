import { Schema, model, models } from "mongoose";

const RequestSchema = new Schema({
  ride: {
    type: Schema.Types.ObjectId,
    ref: "Ride",
    required: true,
  },
  driver: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  passenger: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined","cancelled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const RideRequest = models.RideRequest || model("RideRequest", RequestSchema);

export default RideRequest;