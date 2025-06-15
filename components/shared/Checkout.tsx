"use client";
import React, { useEffect, useState } from "react";
import { IEvent } from "@/lib/database/models/event.model";
import { Button } from "../ui/button";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createFreeOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "@/lib/actions/order.actions";

// Declare Razorpay on window object
declare global {
  interface Window {
    Razorpay: any;
  }
}

const Checkout = ({ event, userId }: { event: IEvent; userId?: string }) => {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  // Use either passed userId or user.id from Clerk
  const currentUserId = userId || user?.id;

  console.log(currentUserId);

  // Debug: Log the userId to make sure it's being passed correctly
  useEffect(() => {
    console.log("Checkout component - passed userId:", userId);
    console.log("Checkout component - user from Clerk:", user?.id);
    console.log("Checkout component - currentUserId:", currentUserId);
    console.log("Checkout component - event:", event);
  }, [userId, user, event, currentUserId]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
      toast.error("Payment system unavailable. Please try again later.");
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Check for payment success/failure in URL
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("payment") === "success") {
      toast.success(
        "Payment successful! You will receive a confirmation email."
      );
      router.replace(window.location.pathname);
    }

    if (query.get("payment") === "failed") {
      toast.error("Payment failed. Please try again.");
      router.replace(window.location.pathname);
    }
  }, [router]);

  const onCheckout = async () => {
    // Validate userId before proceeding
    if (!currentUserId) {
      toast.error("User not authenticated. Please log in.");
      return;
    }

    if (!scriptLoaded) {
      toast.error("Payment system is loading. Please wait and try again.");
      return;
    }

    if (event.isFree) {
      // Handle free events
      try {
        setLoading(true);

        const orderData = {
          eventId: event._id,
          buyerId: currentUserId,
          totalAmount: "0",
          createdAt: new Date(),
        };

        console.log("Creating free order with data:", orderData);

        // Use the createFreeOrder function from your actions
        await createFreeOrder(orderData);

        toast.success("Free ticket booked successfully!");
        router.push(`/profile?payment=success`);
      } catch (error) {
        console.error("Free booking failed:", error);
        toast.error("Booking failed. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    try {
      // Prepare order data with validation
      const orderData = {
        eventTitle: event.title,
        eventId: event._id,
        price: event.price,
        isFree: event.isFree,
        buyerId: currentUserId,
      };

      console.log("Creating Razorpay order with data:", orderData);

      // Create Razorpay order
      const razorpayOrderData = await createRazorpayOrder(orderData);

      console.log("Razorpay order created:", razorpayOrderData);

      // Configure Razorpay options
      const options = {
        key: razorpayOrderData.key,
        amount: razorpayOrderData.amount,
        currency: razorpayOrderData.currency,
        name: "EventHub",
        description: `Ticket for ${event.title}`,
        order_id: razorpayOrderData.orderId,
        handler: async (response: any) => {
          try {
            console.log("Payment response:", response);

            // Verify payment
            const verificationResult = await verifyRazorpayPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              dbOrderId: razorpayOrderData.dbOrderId,
            });

            if (verificationResult.success) {
              toast.success("Payment successful!");
              router.push(`/profile?payment=success`);
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification failed:", error);
            toast.error("Payment verification failed. Please contact support.");
            router.push(`/?payment=failed`);
          }
        },
        prefill: {
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          email: user?.emailAddresses[0]?.emailAddress || "",
          contact: user?.phoneNumbers[0]?.phoneNumber || "",
        },
        notes: {
          eventId: event._id,
          eventTitle: event.title,
          buyerId: currentUserId,
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            console.log("Payment modal closed");
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response: any) => {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        router.push(`/?payment=failed`);
        setLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error("Unable to initiate payment. Please try again.");
      setLoading(false);
    }
  };

  // Don't render the button if userId is not available
  if (!currentUserId) {
    return (
      <div>
        <Button disabled className="button sm:w-fit">
          Please log in to purchase
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button
        type="button"
        size="lg"
        className="button sm:w-fit"
        onClick={onCheckout}
        disabled={loading || !scriptLoaded}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </div>
        ) : event.isFree ? (
          "Get Free Ticket"
        ) : (
          `Buy Ticket - ₹${event.price}`
        )}
      </Button>

      {!scriptLoaded && (
        <p className="text-sm text-gray-500 mt-2">Loading payment system...</p>
      )}
    </div>
  );
};

export default Checkout;
