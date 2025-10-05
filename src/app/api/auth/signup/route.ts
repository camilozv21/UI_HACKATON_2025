import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    await dbConnect();
  try {
    const { email, password } = await req.json();
console.log(email, password);
    if (!email || !password) {
      return NextResponse.json({ error: "Fields are missing" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const newUser = await new User({ email, password }).save();

    return NextResponse.json(
      { message: "User created successfully", user: { email: newUser.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
