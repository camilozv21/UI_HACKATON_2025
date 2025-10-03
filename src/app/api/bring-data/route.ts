import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project, columns } = body;

    // Define el nombre de la tabla según la misión
    const TABLES_BY_MISSION: Record<string, string> = {
      TESS: 'toi',
      K2: 'k2pandc'
    };
    const table = TABLES_BY_MISSION[project];
    if (!table || !columns || !Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json({ error: 'Missing table or columns' }, { status: 400 });
    }

    // Construye la query SQL
    const query = `SELECT ${columns.join(', ')} FROM ${table}`;
    const payload = new URLSearchParams({
      query,
      format: 'csv'
    });

    // Hace el fetch al endpoint externo
    const response = await fetch('https://exoplanetarchive.ipac.caltech.edu/TAP/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload.toString()
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Error fetching data from Exoplanet Archive' }, { status: 500 });
    }

    const csv = await response.text();

    // Devuelve el CSV como texto plano
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${table}_filtered.csv`
      }
    });
  } catch (err) {
    console.error('Error fetching exoplanet data:', err);
    return NextResponse.json(
      { error: 'Error fetching exoplanet data' },
      { status: 500 }
    );
  }
}