// ====== USER PARAMS
export type CreateUserParams = {
  clerkId: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  email: string;
  photo: string;
};

export type UpdateUserParams = {
  firstName: string;
  lastName: string;
  username: string;
  photo: string;
};

// ====== EVENT PARAMS
export type CreateEventParams = {
  userId: string;
  event: {
    title: string;
    description: string;
    location: string;
    imageUrl: string;
    startDateTime: Date;
    endDateTime: Date;
    categoryId: string;
    price: string;
    isFree: boolean;
    url: string;
  };
  path: string;
};

export type UpdateEventParams = {
  userId: string;
  event: {
    _id: string;
    title: string;
    imageUrl: string;
    description: string;
    location: string;
    startDateTime: Date;
    endDateTime: Date;
    categoryId: string;
    price: string;
    isFree: boolean;
    url: string;
  };
  path: string;
};

export type DeleteEventParams = {
  eventId: string;
  path: string;
};

export type GetAllEventsParams = {
  query: string;
  category: string;
  limit: number;
  page: number;
};

export type GetEventsByUserParams = {
  userId: string;
  limit?: number;
  page: number;
};

export type GetRelatedEventsByCategoryParams = {
  categoryId: string;
  eventId: string;
  limit?: number;
  page: number | string;
};

export type Event = {
  _id: string;
  title: string;
  description: string;
  price: string;
  isFree: boolean;
  imageUrl: string;
  location: string;
  startDateTime: Date;
  endDateTime: Date;
  url: string;
  organizer: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  category: {
    _id: string;
    name: string;
  };
};

// ====== CATEGORY PARAMS
export type CreateCategoryParams = {
  categoryName: string;
};

// ====== ORDER PARAMS
// export type CheckoutOrderParams = {
//   eventTitle: string;
//   eventId: string;
//   price: string;
//   isFree: boolean;
//   buyerId: string;
// };

// export type CreateOrderParams = {
//   stripeId: string;
//   eventId: string;
//   buyerId: string;
//   totalAmount: string;
//   createdAt: Date;
// };

// export type GetOrdersByEventParams = {
//   eventId: string;
//   searchString: string;
// };

// export type GetOrdersByUserParams = {
//   userId: string | null;
//   limit?: number;
//   page: string | number | null;
// };

// ====== URL QUERY PARAMS
export type UrlQueryParams = {
  params: string;
  key: string;
  value: string | null;
};

export type RemoveUrlQueryParams = {
  params: string;
  keysToRemove: string[];
};

export type SearchParamProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined | number;
  }>;
};

//OREDER PARAMS

// Add these new types to your existing types file

// Existing types (keep as is)
export type CheckoutOrderParams = {
  eventTitle: string;
  eventId: string;
  price: string;
  isFree: boolean;
  buyerId: string;
};

export type CreateOrderParams = {
  stripeId?: string; // Keep for backward compatibility
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  eventId: string;
  buyerId: string;
  totalAmount: string;
  status?: "pending" | "completed" | "failed" | "refunded";
  createdAt?: Date;
};

export type GetOrdersByEventParams = {
  eventId: string;
  searchString: string;
};

export type GetOrdersByUserParams = {
  userId: string;
  limit?: number;
  page: number;
};

// New Razorpay-specific types
export type VerifyPaymentParams = {
  orderId: string; // Razorpay order ID
  paymentId: string; // Razorpay payment ID
  signature: string; // Razorpay signature
  dbOrderId: string; // Your database order ID
};

export type RazorpayOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
  dbOrderId: string;
};

export type PaymentVerificationResponse = {
  success: boolean;
  message: string;
  order?: any;
};

export type RazorpayPaymentData = {
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
};

// Updated Order model interface
export interface IOrder {
  _id: string;
  stripeId?: string; // Keep for backward compatibility
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  refundId?: string;
  refundAmount?: number;
  totalAmount: string;
  event: string;
  buyer: string;
  status: "pending" | "completed" | "failed" | "refunded";
  createdAt: Date;
  updatedAt?: Date;
}
