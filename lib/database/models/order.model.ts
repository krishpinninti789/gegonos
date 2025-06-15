// import { Schema, model, models, Document } from 'mongoose'

// export interface IOrder extends Document {
//   createdAt: Date
//   stripeId: string
//   totalAmount: string
//   event: {
//     _id: string
//     title: string
//   }
//   buyer: {
//     _id: string
//     firstName: string
//     lastName: string
//   }
// }

// export type IOrderItem = {
//   _id: string
//   totalAmount: string
//   createdAt: Date
//   eventTitle: string
//   eventId: string
//   buyer: string
// }

// const OrderSchema = new Schema({
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
//   stripeId: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   totalAmount: {
//     type: String,
//   },
//   event: {
//     type: Schema.Types.ObjectId,
//     ref: 'Event',
//   },
//   buyer: {
//     type: Schema.Types.ObjectId,
//     ref: 'User',
//   },
// })

// const Order = models.Order || model('Order', OrderSchema)

// export default Order

import { Schema, model, models, Document } from "mongoose";

export interface IOrder extends Document {
  _id: string;
  // Keep Stripe field for backward compatibility
  stripeId?: string;

  // Razorpay fields
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  refundId?: string;
  refundAmount?: number;

  totalAmount: string;
  event: {
    _id: string;
    title: string;
    price: string;
  };
  buyer: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: "pending" | "completed" | "failed" | "refunded";
  createdAt: Date;
  updatedAt?: Date;
}

const OrderSchema = new Schema({
  // Keep for backward compatibility with existing Stripe orders
  stripeId: {
    type: String,
    required: false,
  },

  // Razorpay specific fields
  razorpayOrderId: {
    type: String,
    required: false,
  },
  razorpayPaymentId: {
    type: String,
    required: false,
  },
  refundId: {
    type: String,
    required: false,
  },
  refundAmount: {
    type: Number,
    required: false,
  },

  totalAmount: {
    type: String,
    required: true,
  },
  event: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  buyer: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
OrderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for better query performance
OrderSchema.index({ buyer: 1, status: 1 });
OrderSchema.index({ event: 1, status: 1 });
OrderSchema.index({ razorpayOrderId: 1 });
OrderSchema.index({ razorpayPaymentId: 1 });
OrderSchema.index({ createdAt: -1 });

const Order = models?.Order || model("Order", OrderSchema);

export default Order;
