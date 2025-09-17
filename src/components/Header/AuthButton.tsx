"use client";

import { toggleSession } from "@/actions/auth-actions";
import { Button, Group } from "@mantine/core";
import { Session } from "next-auth";
import Image from "next/image";

export default function AuthButton({ session }: { session: Session | null }) {
  return (
    <form action={toggleSession}>
      <Group>
        {session?.user ? (
          <>
            {session.user && (
              <Image
                src={
                  session.user.image ||
                  "https://df50lbm4qcrt6.cloudfront.net/contia_logo_circle.png"
                }
                alt="User Avatar"
                width={32}
                height={32}
                style={{ borderRadius: "50%" }}
              />
            )}
            <Button
              type="submit"
              variant="outline"
              color="var(--primary-color)"
            >
              Sign out
            </Button>
          </>
        ) : (
          <Button type="submit" variant="light" color="var(--primary-color)">
            Sign in
          </Button>
        )}
      </Group>
    </form>
  );
}
