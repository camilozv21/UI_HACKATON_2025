"use client";

import { useEffect, useState } from "react";
import {
  ActionIcon,
  Button,
  Center,
  Drawer,
  Flex,
  Grid,
  Loader,
  MultiSelect,
  Overlay,
  Paper,
  Text,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconAdjustments } from "@tabler/icons-react";
import { availableLanguages } from "@/utils/languages";
import { useConfigResult } from "@/hooks/useConfigResult";
import { Result } from "./DownloadResult";

export default function ConfigResult({ fileUrl, onResult }: { fileUrl: string, onResult: (res: Result) => void }) {
  const [drawerOpened, setDrawerOpened] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const {
    languages,
    handleLanguagesChange,
    generateResult,
    loading,
    error,
    result,
  } = useConfigResult(fileUrl);

    useEffect(() => {
    if (result) {
      onResult(result);
    }
  }, [result]);

  return (
    <>
      {loading && (
        <Overlay blur={3} color="#fff" opacity={0.8} fixed zIndex={2000}>
          <Center style={{ height: "100vh" }}>
            <Flex align="center" direction="column">
              <Loader size="xl" color="var(--primary-color)" />
              <Text ml="md" fw={600}>
                Generating subtitles...
              </Text>
            </Flex>
          </Center>
        </Overlay>
      )}
      <Grid gutter="md" m="md">
        {/* Columna izquierda / Video */}
        <Grid.Col span={isDesktop ? 9 : 12}>
          <Paper
            shadow="md"
            radius="md"
            p="md"
            withBorder
            style={{
              aspectRatio: "16 / 9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {fileUrl ? (
              <video
                src={fileUrl}
                controls
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  maxWidth: "200px",
                }}
              />
            ) : (
              <Text c="dimmed">Video preview here</Text>
            )}
          </Paper>
        </Grid.Col>

        {/* Columna derecha solo en desktop */}
        {isDesktop && (
          <Grid.Col span={3}>
            <Paper shadow="sm" p="md" withBorder>
              <Text fw={500} mb="md">
                Select Languages
              </Text>
              <MultiSelect
                data={availableLanguages}
                value={languages.map((lang) => lang.value)}
                onChange={handleLanguagesChange}
                label="Languages (max. 5)"
                placeholder="Select languages"
                searchable
                maxValues={5}
                nothingFoundMessage="No results"
              />
              <Button
                fullWidth
                mt="lg"
                color="var(--primary-color)"
                onClick={generateResult}
                loading={loading}
              >
                Generate
              </Button>
              {error && <Text c="red">{error}</Text>}
            </Paper>
          </Grid.Col>
        )}

        {/* Botón y Drawer en mobile */}
        {!isDesktop && (
          <>
            {/* <Burger opened={drawerOpened} onClick={() => setDrawerOpened(true)} /> */}
            <ActionIcon
              variant="filled"
              color="var(--primary-color)"
              aria-label="Open Settings"
              onClick={() => setDrawerOpened(true)}
              style={{ position: "absolute", top: 70, right: 10 }}
            >
              <IconAdjustments
                style={{ width: "70%", height: "70%" }}
                stroke={1.5}
              />
            </ActionIcon>

            <Drawer
              opened={drawerOpened}
              onClose={() => setDrawerOpened(false)}
              title="Language Options"
              position="right"
              size="sm"
            >
              <MultiSelect
                data={availableLanguages}
                value={languages.map((lang) => lang.value)}
                onChange={handleLanguagesChange}
                label="Languages (max. 5)"
                placeholder="Select languages"
                searchable
                maxValues={5}
                nothingFoundMessage="No results"
              />
              <Button
                fullWidth
                mt="lg"
                color="var(--primary-color)"
                onClick={generateResult}
                loading={loading}
              >
                Generate
              </Button>
              {error && <Text c="red">{error}</Text>}
            </Drawer>
          </>
        )}
      </Grid>
    </>
  );
}
