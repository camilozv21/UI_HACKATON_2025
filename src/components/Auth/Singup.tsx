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

export default function Signup() {
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (form.password !== form.confirmPassword) {
      alert("The passwords do not match");
      setLoading(false);
      return;
    }

    // Aquí puedes integrar tu lógica de registro o API
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("User registered:", data);
      setLoading(false);
      setForm({ email: "", password: "", confirmPassword: "" });
      alert("Registration successful!");
      close();
    } else {
      const errorData = await response.json();
      setLoading(false);
      alert(`Registration failed: ${errorData.error}`);
    }
    console.log("Registration data:", form);
    close();
  };

  return (
    <>
      {/* Botón en el header */}
      <Button variant="filled" color="var(--primary-color)" onClick={open}>
        Sign Up
      </Button>

      {/* Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title="Create your account"
        centered
        radius="md"
      >
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="youremail@example.com"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <PasswordInput
              label="Password"
              placeholder="••••••••"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <PasswordInput
              label="Confirm Password"
              placeholder="••••••••"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            <Group justify="flex-end" mt="sm">
              <Button variant="default" onClick={close}>
                Cancel
              </Button>
              <Button loading={loading} type="submit">Sign Up</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
