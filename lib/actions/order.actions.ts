"use server";

import {
  CheckoutOrderParams,
  GetOrdersByEventParams,
  GetOrdersByUserParams,
} from "@/types";
import connectToDB from "../database";
import Order from "../database/models/order.model";
import razorpay from "../razorpay";
import { handleError } from "../utils";
import { ObjectId } from "mongodb";
import User from "../database/models/user.model";
import Event from "../database/models/event.model";
import { auth } from "@clerk/nextjs/server";

// CREATE RAZORPAY ORDER (Fixed version)
export const createRazorpayOrder = async (order: CheckoutOrderParams) => {
  const amount = order.isFree ? 0 : Number(order.price) * 100;
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId as string; // Convert to paise

  try {
    await connectToDB();

    // Debug logging
    console.log("Order object received:", order);
    console.log("buyerId:", order.buyerId);
    console.log("eventId:", order.eventId);

    // Validate required fields
    if (!order.buyerId) {
      console.error("Missing buyerId in order object");
      throw new Error("Buyer ID is required");
    }
    if (!order.eventId) {
      console.error("Missing eventId in order object");
      throw new Error("Event ID is required");
    }

    // For free events, skip Razorpay and create order directly
    if (order.isFree) {
      const freeOrder = await Order.create({
        razorpayOrderId: `free_${Date.now()}`,
        stripeId: `free_${Date.now()}`, // Keep for compatibility
        event: order.eventId,
        buyer: order.buyerId,
        totalAmount: "0",
        status: "completed", // Free orders are completed immediately
        createdAt: new Date(),
      });

      console.log("Free order created:", freeOrder);

      return {
        orderId: freeOrder.razorpayOrderId,
        amount: 0,
        currency: "INR",
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        dbOrderId: freeOrder._id,
        isFree: true,
      };
    }

    // Create Razorpay order for paid events
    const razorpayOrder = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: true,
      notes: {
        eventId: order.eventId,
        buyerId: order.buyerId,
        eventTitle: order.eventTitle,
      },
    });

    console.log("Razorpay order created:", razorpayOrder);

    // Prepare order data
    const orderData = {
      razorpayOrderId: razorpayOrder.id,
      stripeId: razorpayOrder.id, // Keep for compatibility
      event: order.eventId,
      buyer: userId,
      totalAmount: order.price,
      status: "pending",
      createdAt: new Date(),
    };

    console.log("Order data to be saved:", orderData);

    // Save order to database with pending status
    const newOrder = await Order.create(orderData);

    console.log("Database order created:", newOrder);

    return {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      dbOrderId: newOrder._id,
      isFree: false,
    };
  } catch (error) {
    console.error("Error in createRazorpayOrder:", error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    handleError(error);
    throw error;
  }
};

// VERIFY PAYMENT (Updated with better error handling)
export const verifyRazorpayPayment = async (params: {
  orderId: string;
  paymentId: string;
  signature: string;
  dbOrderId: string;
}) => {
  try {
    await connectToDB();

    const { orderId, paymentId, signature, dbOrderId } = params;

    console.log("Verifying payment:", {
      orderId,
      paymentId,
      signature,
      dbOrderId,
    });

    // Verify signature
    const crypto = require("crypto");
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Signature verification failed");
      console.error("Expected:", expectedSignature);
      console.error("Received:", signature);
      throw new Error("Payment verification failed");
    }

    // Update order status to completed
    const updatedOrder = await Order.findByIdAndUpdate(
      dbOrderId,
      {
        razorpayPaymentId: paymentId,
        status: "completed",
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedOrder) {
      throw new Error("Order not found");
    }

    console.log("Payment verified and order updated:", updatedOrder);

    return {
      success: true,
      message: "Payment verified successfully",
      order: JSON.parse(JSON.stringify(updatedOrder)),
    };
  } catch (error) {
    console.error("Error in verifyRazorpayPayment:", error);
    handleError(error);
    throw error;
  }
};

// CREATE FREE ORDER (Separate function for clarity)
export const createFreeOrder = async (orderData: {
  eventId: string;
  buyerId: string;
  totalAmount: string;
  createdAt: Date;
}) => {
  try {
    await connectToDB();

    console.log("Creating free order:", orderData);

    // Validate required fields
    if (!orderData.buyerId) {
      throw new Error("Buyer ID is required");
    }
    if (!orderData.eventId) {
      throw new Error("Event ID is required");
    }

    const newOrder = await Order.create({
      razorpayOrderId: `free_${Date.now()}`,
      stripeId: `free_${Date.now()}`, // Keep for compatibility
      event: orderData.eventId,
      buyer: orderData.buyerId,
      totalAmount: orderData.totalAmount || "0",
      status: "completed", // Free orders are completed immediately
      createdAt: orderData.createdAt || new Date(),
    });

    console.log("Free order created successfully:", newOrder);

    return JSON.parse(JSON.stringify(newOrder));
  } catch (error) {
    console.error("Error in createFreeOrder:", error);
    handleError(error);
    throw error;
  }
};

// HANDLE PAYMENT FAILURE
export const handlePaymentFailure = async (orderId: string) => {
  try {
    await connectToDB();

    console.log("Handling payment failure for order:", orderId);

    const updatedOrder = await Order.findOneAndUpdate(
      { razorpayOrderId: orderId },
      {
        status: "failed",
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedOrder) {
      console.error("Order not found for ID:", orderId);
      throw new Error("Order not found");
    }

    console.log("Order marked as failed:", updatedOrder);

    return JSON.parse(JSON.stringify(updatedOrder));
  } catch (error) {
    console.error("Error in handlePaymentFailure:", error);
    handleError(error);
    throw error;
  }
};

// GET ORDER BY RAZORPAY ORDER ID
export async function getOrderByRazorpayId(razorpayOrderId: string) {
  try {
    await connectToDB();

    console.log("Fetching order by Razorpay ID:", razorpayOrderId);

    const order = await Order.findOne({ razorpayOrderId })
      .populate({
        path: "event",
        model: "Event", // Make sure this matches your Event model name
      })
      .populate({
        path: "buyer",
        model: "User", // Make sure this matches your User model name
        select: "_id firstName lastName email",
      });

    if (!order) {
      throw new Error("Order not found");
    }

    console.log("Order found:", order);

    return JSON.parse(JSON.stringify(order));
  } catch (error) {
    console.error("Error in getOrderByRazorpayId:", error);
    handleError(error);
    throw error;
  }
}

//GET EVENTS

export async function getOrdersByEvent({
  searchString,
  eventId,
}: GetOrdersByEventParams) {
  try {
    await connectToDB();

    if (!eventId) throw new Error("Event ID is required");
    const eventObjectId = new ObjectId(eventId);

    const orders = await Order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "buyer",
          foreignField: "_id",
          as: "buyer",
        },
      },
      {
        $unwind: "$buyer",
      },
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "event",
        },
      },
      {
        $unwind: "$event",
      },
      {
        $project: {
          _id: 1,
          totalAmount: 1,
          createdAt: 1,
          eventTitle: "$event.title",
          eventId: "$event._id",
          buyer: {
            $concat: ["$buyer.firstName", " ", "$buyer.lastName"],
          },
        },
      },
      {
        $match: {
          $and: [
            { eventId: eventObjectId },
            { buyer: { $regex: RegExp(searchString, "i") } },
          ],
        },
      },
    ]);

    return JSON.parse(JSON.stringify(orders));
  } catch (error) {
    handleError(error);
  }
}

// GET ORDERS BY USER
export async function getOrdersByUser({
  userId,
  limit = 3,
  page,
}: GetOrdersByUserParams) {
  try {
    await connectToDB();

    const skipAmount = (Number(page) - 1) * limit;
    const conditions = { buyer: userId };

    const orders = await Order.distinct("event._id")
      .find(conditions)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit)
      .populate({
        path: "event",
        model: Event,
        populate: {
          path: "organizer",
          model: User,
          select: "_id firstName lastName",
        },
      });

    const ordersCount = await Order.distinct("event._id").countDocuments(
      conditions
    );

    return {
      data: JSON.parse(JSON.stringify(orders)),
      totalPages: Math.ceil(ordersCount / limit),
    };
  } catch (error) {
    handleError(error);
  }
}
