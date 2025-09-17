"use client";

import { Container, Flex, Text } from "@mantine/core";
import classes from "./Footer.module.css";
import Link from "next/link";
import Image from "next/image";

const data = [
  {
    title: "About",
    links: [
      { label: "Features", link: "#" },
      { label: "Pricing", link: "#" },
      { label: "Support", link: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", link: "#" },
      { label: "Terms & Conditions", link: "#" },
      { label: "Cookies", link: "#" },
    ],
  },
];

export default function Footer() {
  const groups = data.map((group) => {
    const links = group.links.map((link, index) => (
      <Link
        key={index}
        className={classes.link}
        href={link.link}
        onClick={(event) => event.preventDefault()}
      >
        {link.label}
      </Link>
    ));

    return (
      <div className={classes.wrapper} key={group.title}>
        <Text className={classes.title}>{group.title}</Text>
        {links}
      </div>
    );
  });

  return (
    <footer className={classes.footer}>
      <Container className={classes.inner}>
        <div className={classes.logo}>
          <Flex align="center" gap="5px">
            <Image
              src="https://df50lbm4qcrt6.cloudfront.net/adacompilance/adacompilance_logo.png"
              alt="Logo"
              width={40}
              height={40}
              className={classes.logoImage}
            />
            <Text fw={700}>ADA Compliance</Text>
          </Flex>
          <Text size="xs" c="dimmed" className={classes.description}>
            Instantly generate ADA-compliant VTT captions for your videos using
            AI
          </Text>
        </div>
        <div className={classes.groups}>{groups}</div>
      </Container>
      <Container className={classes.afterFooter}>
        <Text c="dimmed" size="sm">
          © 2025 J&M Industry. All rights reserved.
        </Text>
      </Container>
    </footer>
  );
}
