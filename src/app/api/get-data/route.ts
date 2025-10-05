import { NextResponse } from "next/server";

export async function POST(req: Request) {

  try {
    const { query, source, optional_filters } = await req.json();

    // const response = await fetch("https://train-model-283656469399.europe-west1.run.app/predict2", {
    const response = await fetch("https://get-data-283656469399.europe-west1.run.app/get_data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        source,
        optional_filters
      }),
    });

    const data = await response.json();

    return NextResponse.json({ data });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    );
  }
};
