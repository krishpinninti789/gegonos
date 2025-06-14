import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

const cached = (global as any).mongoose || { conn: null, promise: null };

const connectToDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  cached.promise =
    cached.promise ||
    mongoose.connect(MONGODB_URI, {
      dbName: "gegonos",
      bufferCommands: false,
    });

  cached.conn = await cached.promise;
  // console.log("Successfully connected to db");

  return cached.conn;
};

export default connectToDB;
