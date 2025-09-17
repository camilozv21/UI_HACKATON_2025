"use client";

import { Burger, Container, Flex, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "./Header.module.css";
import Image from "next/image";
import Link from "next/link";
import AuthButton from "./AuthButton";
import { Session } from "next-auth";

const links = [
  { link: "/about", label: "Features" },
  { link: "/pricing", label: "Pricing" },
  { link: "/learn", label: "Learn" },
];

export default function Header({ session }: { session: Session | null }) {
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
            src="https://df50lbm4qcrt6.cloudfront.net/adacompilance/adacompilance_logo.png"
            alt="Logo"
            width={40}
            height={40}
            className={classes.logo}
          />
        </Link>
        <Group gap={5} visibleFrom="xs">
          {items}
        </Group>

        <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />

        <Flex gap={10} style={{ marginLeft: "auto" }} visibleFrom="xs">
          <AuthButton session={session} />
        </Flex>
      </Container>
    </header>
  );
}
