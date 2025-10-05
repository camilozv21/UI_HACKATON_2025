"use client";

import React, { useState } from "react";
import {
  Modal,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export default function Signin() {
  const [opened, { open, close }] = useDisclosure(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("User signed in:", data);
      setLoading(false);
      setEmail("");
      setPassword("");
      alert("Sign in successful!");
      close();
    } else {
      const errorData = await response.json();
      setLoading(false);
      alert(`Sign in failed: ${errorData.error}`);
    }
    // Aquí puedes agregar tu lógica de autenticación o llamada a API
    console.log({ email, password });
    close();
  };

  return (
    <>
      {/* Button in the header */}
      <Button variant="light" color="var(--primary-color)" onClick={open}>
        Sign In
      </Button>

      {/* Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title="Sign In"
        centered
        radius="md"
      >
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="youremail@example.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
            />

            <PasswordInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
            />

            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={close}>
                Cancel
              </Button>
              <Button type="submit">Sign In</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
