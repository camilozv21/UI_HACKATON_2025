"use client";

import { Button, Paper, Text, Center } from "@mantine/core";

export type Result = {
  files: {
    [lang: string]: string; // idioma -> url firmada en GCS
  };
};

export default function DownloadResult() {

  return (
    <Center style={{ minHeight: "70vh" }}>
      <Paper shadow="md" p="xl" radius="md" withBorder>
        <Text fw={600} size="lg" mb="md" ta="center">
          Subtitles ready! 🎉
        </Text>
        <Button
          size="lg"
          color="var(--primary-color)"
          fullWidth
        >
          Download VTT files
        </Button>
      </Paper>
    </Center>
  );
}
