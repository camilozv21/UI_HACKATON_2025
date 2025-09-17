"use server";

import { auth, signIn, signOut } from "@/auth";

export async function toggleSession() {
  const session = await auth();
  if (session) {
    await signOut();
  } else {
    await signIn("google");
  }
}

// export async function doSignIn() {
//   await signIn("google");
// }

// export async function doSignOut() {
//   await signOut();
// }
