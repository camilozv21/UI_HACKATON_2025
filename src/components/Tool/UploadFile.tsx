"use client";

import { Button, Center, Flex, Group, Text } from "@mantine/core";
import React, { useRef } from "react";
import classes from "./UploadFile.module.css";
import {
  DropzoneAccept,
  DropzoneFullScreen,
  DropzoneIdle,
  DropzoneReject,
  MIME_TYPES,
} from "@mantine/dropzone";
import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react";
import { useUploadFile } from "@/hooks/useUploadFile";

export default function UploadFile({
  onUpload,
}: {
  onUpload: (url: string) => void;
}) {
  const openRef = useRef<() => void>(null);
  const { uploadFile, uploading, error } = useUploadFile();

  return (
    <>
      <Center mt={"1.5rem"} className={classes.container}>
        <div className={classes.wrapper}>
          <div>
            <Text component="div">
              <h1 className={classes.title}>Generate ADA Compliant Captions</h1>
            </Text>
          </div>
          <div>
            <Text mt={1} component="div">
              <h2 className={classes.description}>
                Create accessible VTT subtitles for your videos using advanced
                AI.
              </h2>
            </Text>
          </div>
        </div>
      </Center>

      <Flex justify="center" mt="1rem" direction="column" align="center">
        <Group>
          <Button
            color="var(--primary-color)"
            size="xl"
            radius="lg"
            onClick={() => openRef.current?.()}
            style={{ pointerEvents: "all" }}
            loading={uploading}
          >
            {uploading ? "Uploading..." : "Select video file"}
          </Button>
        </Group>
        <Text visibleFrom="xs" fw={300} fz="14px">
          or drop your video here
        </Text>
        {error && <Text c="red">{error}</Text>}
      </Flex>

      <DropzoneFullScreen
        openRef={openRef}
        accept={[MIME_TYPES.mp4]}
        onDrop={async (files) => {
          if (files.length > 0) {
            const url = await uploadFile(files[0]);
            if (url) onUpload(url);
          }
        }}
      >
        <Group
          justify="center"
          gap="xl"
          mih={220}
          style={{ pointerEvents: "none" }}
        >
          <DropzoneAccept>
            <IconUpload
              size={52}
              color="var(--mantine-color-blue-6)"
              stroke={1.5}
            />
          </DropzoneAccept>
          <DropzoneReject>
            <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5} />
          </DropzoneReject>
          <DropzoneIdle>
            <IconPhoto
              size={52}
              color="var(--mantine-color-dimmed)"
              stroke={1.5}
            />
          </DropzoneIdle>

          <div>
            <Text size="xl" inline>
              Drag videos here or click to select files
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              File should not exceed 60 minutes in duration
            </Text>
          </div>
        </Group>
      </DropzoneFullScreen>
    </>
  );
}
