"use client";

import React, { useRef } from "react";
import Image from "next/image";
import {
    Container,
    Title,
    Text,
    Button,
    Grid,
    Card,
    Group,
    Stack,
    Divider,
} from "@mantine/core";
import {
    IconRocket,
    IconBrain,
    IconUsers,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Carousel } from '@mantine/carousel';
import Autoplay from 'embla-carousel-autoplay';

export default function CoreContent() {
    const router = useRouter();// start detecting exoplanets
    const autoplay = useRef(Autoplay({ delay: 3000 }));

    const images = [
        "https://df50lbm4qcrt6.cloudfront.net/hackathon/bannerhackathon.jpg",
        "https://df50lbm4qcrt6.cloudfront.net/hackathon/carousel1.jpg",
        "https://df50lbm4qcrt6.cloudfront.net/hackathon/carousel2.jpg",
        "https://df50lbm4qcrt6.cloudfront.net/hackathon/carousel3.jpg",
        "https://df50lbm4qcrt6.cloudfront.net/hackathon/carousel4.jpg",
    ];

    return (
        <Container size="lg" py="xl">
            {/* Hero banner */}
            <Card radius="md" withBorder shadow="sm" mb="xl" p={0} style={{ position: "relative", overflow: "hidden" }}>
                {/* Imagen de fondo */}
                <Carousel
                    withIndicators
                    plugins={[autoplay.current]}
                    onMouseEnter={autoplay.current.stop}
                    onMouseLeave={autoplay.current.reset}
                    slideSize="100%"
                    slideGap={0}
                    style={{ borderRadius: "0.5rem" }}
                >
                                        {images.map((src, index) => (
                        <Carousel.Slide key={index}>
                            <div style={{ position: "relative" }}>
                                <Image
                                    src={src}
                                    alt={`Slide ${index + 1}`}
                                    width={1200}
                                    height={500}
                                    style={{
                                        width: "100%",
                                        height: "auto",
                                        borderRadius: "0.5rem",
                                        display: "block",
                                    }}
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "8px",
                                        left: "8px",
                                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                                        color: "white",
                                        padding: "2px 4px",
                                        borderRadius: "4px",
                                        fontSize: "0.8rem",
                                    }}
                                >
                                    AI generated image*
                                </div>
                            </div>
                        </Carousel.Slide>
                    ))}
                </Carousel>

                {/* Overlay oscuro */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0, 0, 0, 0.55)",
                        borderRadius: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        color: "white",
                        textAlign: "center",
                        padding: "2rem",
                    }}
                >
                    <Title
                        order={2}
                        style={{
                            color: "white",
                            marginBottom: "1rem",
                            textShadow: "0 2px 6px rgba(0,0,0,0.4)",
                        }}
                    >
                        Explore our AI-powered Exoplanet Detection Tool
                    </Title>

                    <Button
                        size="xl"
                        radius="md"
                        color="indigo"
                        variant="filled"
                        style={{
                            fontWeight: 600,
                            fontSize: "1.1rem",
                            boxShadow: "0 0 15px rgba(0,0,0,0.3)",
                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        }}
                        onMouseEnter={(e) =>
                        ((e.currentTarget.style.transform = "scale(1.05)"),
                            (e.currentTarget.style.boxShadow = "0 0 25px rgba(99, 102, 241, 0.6)"))
                        }
                        onMouseLeave={(e) =>
                        ((e.currentTarget.style.transform = "scale(1)"),
                            (e.currentTarget.style.boxShadow = "0 0 15px rgba(0,0,0,0.3)"))
                        }
                        onClick={() => { 
                            router.push('/dashboard')
                        }}
                    >
                        Go To Exoplanets ML Studio
                    </Button>
                </div>
            </Card>


            {/* Introduction */}
            <Stack align="center" mb="xl">
                <Title order={1} ta="center">
                    Identifying Exoplanets with Artificial Intelligence 🌌
                </Title>
                <Text ta="center" c="dimmed" maw={700}>
                    Our project leverages NASA’s open-source exoplanet datasets and
                    state-of-the-art machine learning techniques to automatically detect
                    exoplanets using the transit method.
                </Text>
                <Button size="md" mt="md" radius="md" variant="filled" color="var(--primary-color)" onClick={() => router.push('/dashboard')}>
                    View Our Solution
                </Button>
            </Stack>

            <Divider my="lg" />

            {/* Challenge and Solution */}
            <Grid gutter="xl" align="center">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Title order={2}>🚀 The Challenge</Title>
                    <Text mt="sm" c="dimmed">
                        NASA missions like <b>Kepler</b>, <b>K2</b>, and <b>TESS</b> have
                        gathered massive datasets on light intensity from distant stars to
                        identify potential exoplanets. However, much of this data was
                        processed manually. The challenge was to develop an AI/ML model that
                        can automatically analyze new data to identify exoplanetary
                        candidates.
                    </Text>

                    <Title order={3} mt="lg">
                        🧠 Our Solution
                    </Title>
                    <Text mt="sm" c="dimmed">
                        We built an intelligent system trained on NASA’s TESS dataset to
                        classify planetary signals using machine learning. Our approach
                        focuses on data preprocessing, feature selection, and a custom
                        classification model to achieve high accuracy and interpretability.
                    </Text>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card shadow="sm" radius="md" withBorder>
                        <Group>
                            <IconBrain size={32} color="indigo" />
                            <Text fw={500}>AI-Powered Classification</Text>
                        </Group>
                        <Text size="sm" c="dimmed" mt="xs">
                            The model leverages supervised learning to distinguish confirmed
                            exoplanets, candidates, and false positives.
                        </Text>

                        <Group mt="md">
                            <IconRocket size={32} color="blue" />
                            <Text fw={500}>Built with NASA Open Data</Text>
                        </Group>
                        <Text size="sm" c="dimmed" mt="xs">
                            Using Kepler and TESS datasets, we extracted key features such as
                            orbital period, transit depth, and radius to train and evaluate
                            our AI pipeline.
                        </Text>
                    </Card>
                </Grid.Col>
            </Grid>

            <Divider my="xl" />

            {/* Project Goals / Achievements */}
            <Title order={2} ta="center" mb="md">
                Project Highlights
            </Title>

            <Grid gutter="lg">
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card shadow="sm" radius="md" withBorder p="md">
                        <IconRocket size={36} color="violet" />
                        <Text fw={600} mt="sm">
                            Automated Detection
                        </Text>
                        <Text size="sm" c="dimmed">
                            Automatically classifies exoplanetary candidates using transit
                            method data.
                        </Text>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card shadow="sm" radius="md" withBorder p="md">
                        <IconUsers size={36} color="teal" />
                        <Text fw={600} mt="sm">
                            Interactive Interface
                        </Text>
                        <Text size="sm" c="dimmed">
                            Web-based interface to visualize predictions and explore datasets.
                        </Text>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card shadow="sm" radius="md" withBorder p="md">
                        <IconBrain size={36} color="orange" />
                        <Text fw={600} mt="sm">
                            ML-Driven Insights
                        </Text>
                        <Text size="sm" c="dimmed">
                            Uses explainable AI to interpret feature importance and model
                            decisions.
                        </Text>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Card shadow="sm" radius="md" withBorder p="md">
                        <IconRocket size={36} color="blue" />
                        <Text fw={600} mt="sm">
                            NASA-Backed Data
                        </Text>
                        <Text size="sm" c="dimmed">
                            Built entirely from NASA’s Kepler and TESS mission datasets.
                        </Text>
                    </Card>
                </Grid.Col>
            </Grid>

            <Divider my="xl" />

            {/* Footer */}
            <Stack align="center" mt="xl" mb="md">
                <Text size="sm" c="dimmed" ta="center" maw={600}>
                    © 2025 Exoplanet AI Project — Built for NASA’s Hackathon Challenge.
                    Powered by Machine Learning and Open Data.
                </Text>
            </Stack>
        </Container>
    );
}
