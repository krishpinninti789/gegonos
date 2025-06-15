"use client";

import { IEvent } from "@/lib/database/models/event.model";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import Checkout from "./Checkout";

const CheckoutButton = async ({ event }: { event: IEvent }) => {
  const { userId } = await auth();

  const hasEventFinished = new Date(event.endDateTime) < new Date();

  return (
    <div className="flex items-center gap-3">
      {hasEventFinished ? (
        <p className="p-2 text-red-400">
          Sorry, tickets are no longer available.
        </p>
      ) : (
        <>
          <SignedOut>
            <Button asChild className="button rounded-full" size="lg">
              <Link href="/sign-in">Get Tickets</Link>
            </Button>
          </SignedOut>

          <SignedIn>
            <Checkout event={event} userId={userId!} />
          </SignedIn>
        </>
      )}
    </div>
  );
};

export default CheckoutButton;
