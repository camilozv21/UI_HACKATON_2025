"use client";

import { Burger, Container, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "./Header.module.css";
import Image from "next/image";
import Link from "next/link";

const links = [
  // { link: "/about", label: "Features" },
  // { link: "/pricing", label: "Pricing" },
  { link: "/team", label: "Team" },
];

export default function Header() {
  const [opened, { toggle }] = useDisclosure(false);

  const items = links.map((link) => (
    <Link key={link.label} href={link.link} className={classes.link}>
      {link.label}
    </Link>
  ));

  return (
    <header className={classes.header}>
      <Container fluid className={classes.inner}>
        <Link href="/">
          <Image
            src="https://df50lbm4qcrt6.cloudfront.net/hackathon/logo_website.png"
            alt="Logo"
            width={60}
            height={60}
            className={classes.logo}
          />
        </Link>
        <Group gap={5} visibleFrom="xs">
          {items}
        </Group>

        <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />
      </Container>
    </header>
  );
}
