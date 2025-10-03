"use client"

import React, { useEffect, useMemo, useState } from "react";
import {
  Card, Text, Group, Badge, Button, Input, Select, Switch, Tabs, Table, Slider, NumberInput,
  Title, Container, Grid, Box, Divider, rem,
  TableThead,
  TableTr,
  TableTh,
  TableTbody,
  TableTd
} from "@mantine/core";
import { Rocket, Settings, Activity, FlaskConical, Shuffle, Trees, GitBranch, Gauge } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Legend, AreaChart, Area, BarChart, Bar } from "recharts";

const sampleRoc = Array.from({ length: 21 }, (_, i) => ({
  fpr: i / 20,
  tpr: Math.pow(i / 20, 0.7),
}));
const samplePr = Array.from({ length: 21 }, (_, i) => ({
  recall: i / 20,
  precision: 0.9 - 0.5 * Math.pow(i / 20, 1.2),
}));
const sampleImportances = [
  { name: "bls_snr", value: 0.28 },
  { name: "bls_depth", value: 0.21 },
  { name: "tsfresh__autocorr_lag5", value: 0.17 },
  { name: "tsfresh__fft_energy", value: 0.14 },
  { name: "bls_duration", value: 0.11 },
  { name: "tsfresh__kurtosis", value: 0.09 },
];

const sampleRuns = [
  {
    id: "run_2025_09_21_001",
    model: "RandomForest",
    dataset: "ps+toi_fp_v1",
    featureSchema: "minimal@1",
    prauc: 0.84,
    recall: 0.82,
    f1: 0.79,
    createdAt: "2025-09-21 22:14",
    owner: "daniel",
  },
  {
    id: "run_2025_09_20_003",
    model: "DecisionTree",
    dataset: "ps+toi_fp_v1",
    featureSchema: "minimal@1",
    prauc: 0.78,
    recall: 0.74,
    f1: 0.75,
    createdAt: "2025-09-20 15:02",
    owner: "daniel",
  },
];

// ---- Registros precalculados de prueba ----
// Nota: reemplaza por tu fetch a /stars?mission=... para producción.
export type RecordItem = {
  id: string;              // TIC o KIC
  mission: "TESS" | "Kepler";
  mag: number;             // Magnitud
  period: number;          // días
  depth_ppm: number;       // profundidad en ppm
  duration_hr: number;     // horas
  bls_snr: number;         // SNR BLS
  proba: number;           // score del modelo prod
  label: "confirmed" | "fp" | "candidate";
  updatedAt: string;       // ISO/fecha legible
  updatedTs?: number;      // timestamp precalculado para ordenar
};

const sampleRecords: RecordItem[] = [
  { id: "TIC 140123456", mission: "TESS", mag: 10.3, period: 3.21, depth_ppm: 820, duration_hr: 3.4, bls_snr: 12.4, proba: 0.87, label: "candidate", updatedAt: "2025-09-20 12:10" },
  { id: "TIC 392847111", mission: "TESS", mag: 12.1, period: 7.92, depth_ppm: 540, duration_hr: 2.7, bls_snr: 9.8, proba: 0.74, label: "candidate", updatedAt: "2025-09-21 08:55" },
  { id: "TIC 880045201", mission: "TESS", mag: 9.7,  period: 1.53, depth_ppm: 1300, duration_hr: 2.1, bls_snr: 15.1, proba: 0.91, label: "confirmed", updatedAt: "2025-09-19 21:30" },
  { id: "TIC 221993004", mission: "TESS", mag: 13.0, period: 5.17, depth_ppm: 410, duration_hr: 4.0, bls_snr: 8.6, proba: 0.61, label: "fp", updatedAt: "2025-09-18 10:05" },
  { id: "TIC 309991777", mission: "TESS", mag: 11.4, period: 2.44, depth_ppm: 980, duration_hr: 1.8, bls_snr: 13.7, proba: 0.83, label: "candidate", updatedAt: "2025-09-17 17:42" },
  { id: "KIC 11446443",  mission: "Kepler", mag: 12.8, period: 4.89, depth_ppm: 700, duration_hr: 3.1, bls_snr: 10.9, proba: 0.79, label: "candidate", updatedAt: "2025-09-20 09:02" },
  { id: "KIC 1026032",   mission: "Kepler", mag: 13.5, period: 10.12, depth_ppm: 350, duration_hr: 5.6, bls_snr: 7.2,  proba: 0.58, label: "fp", updatedAt: "2025-09-19 13:40" },
  { id: "KIC 757450",    mission: "Kepler", mag: 11.2, period: 0.96, depth_ppm: 1600, duration_hr: 1.4, bls_snr: 18.4, proba: 0.94, label: "confirmed", updatedAt: "2025-09-21 11:33" },
  { id: "KIC 8349582",   mission: "Kepler", mag: 14.1, period: 2.77, depth_ppm: 620, duration_hr: 2.0, bls_snr: 11.3, proba: 0.72, label: "candidate", updatedAt: "2025-09-18 22:09" },
  { id: "TIC 550019911", mission: "TESS", mag: 10.9, period: 12.30, depth_ppm: 230, duration_hr: 6.2, bls_snr: 6.8,  proba: 0.45, label: "fp", updatedAt: "2025-09-16 06:20" },
  { id: "KIC 9834739",   mission: "Kepler", mag: 12.0, period: 3.02, depth_ppm: 900, duration_hr: 2.6, bls_snr: 14.2, proba: 0.88, label: "candidate", updatedAt: "2025-09-15 19:55" },
  { id: "TIC 991543220", mission: "TESS", mag: 9.2,  period: 0.72, depth_ppm: 2100, duration_hr: 1.1, bls_snr: 22.0, proba: 0.97, label: "confirmed", updatedAt: "2025-09-21 20:12" },
];

// ---- Tipos auxiliares ----
type RFParams = {
  n_estimators: number;
  max_depth: number | null;
  max_features: "sqrt" | "log2" | "auto";
  min_samples_split: number;
  min_samples_leaf: number;
  class_weight: "balanced" | "none";
  bootstrap: boolean;
};

type DTParams = {
  criterion: "gini" | "entropy";
  max_depth: number | null;
  min_samples_split: number;
  min_samples_leaf: number;
  max_features: "sqrt" | "log2" | "none";
  ccp_alpha: number;
};

type Metrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  rocauc: number;
  prauc: number;
};

type PsFilters = {
  period_min: number | null;
  period_max: number | null;
  radius_min: number | null;
  radius_max: number | null;
  teff_min: number | null;
  teff_max: number | null;
  logg_min: number | null;
  logg_max: number | null;
  feh_min: number | null;
  feh_max: number | null;
  mag_min: number | null;
  mag_max: number | null;
};

type SortKey = "score" | "updatedAt" | "period";

// ---- Utilidades mock ----
function formatPct(x: number) {
  return (x * 100).toFixed(1) + "%";
}

function mockTrain(model: "rf" | "dt", seed: number): Metrics {
  const base = model === "rf" ? 0.78 : 0.72;
  const jitter = ((seed % 97) / 500) * (model === "rf" ? 1 : 0.9);
  const prauc = base + 0.06 + jitter;
  const rocauc = base + 0.12 + jitter;
  const recall = base + 0.05 + jitter * 0.8;
  const precision = base + 0.02 + jitter * 0.6;
  const f1 = (2 * precision * recall) / (precision + recall);
  const accuracy = base + 0.08 + jitter * 0.5;
  return { accuracy, precision, recall, f1, rocauc, prauc };
}

// ---- Componentes de UI reutilizables ----
function KPI({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <Card shadow="sm" padding="md">
      <Group gap="xs">
        {Icon && <Icon size={20} style={{ opacity: 0.7 }} />}
        <div>
          <Text size="xs" c="dimmed">{label}</Text>
          <Text size="lg" fw={600}>{value}</Text>
        </div>
      </Group>
    </Card>
  );
}

function Section({ title, children, icon: Icon }: React.PropsWithChildren<{ title: string; icon?: any }>) {
  return (
    <Card shadow="sm" padding="md">
      <Group gap="xs" mb="xs">
        {Icon && <Icon size={20} />}
        <Title order={4}>{title}</Title>
      </Group>
      <Divider mb="xs" />
      <Box>{children}</Box>
    </Card>
  );
}

// ---- Vista principal ----
export default function Dashboard() {
  const [dataset, setDataset] = useState("ps+toi_fp_v1");
  const [featureSchema, setFeatureSchema] = useState("minimal@1");
  const [groupK, setGroupK] = useState(5);
  const [seed, setSeed] = useState(42);
  const [threshold, setThreshold] = useState<number>(50); // 0–100

  // Filtros (PS confirmados)
  const [psFilters, setPsFilters] = useState<PsFilters>({
    period_min: null, period_max: null,
    radius_min: null, radius_max: null,
    teff_min: null, teff_max: null,
    logg_min: null, logg_max: null,
    feh_min: null, feh_max: null,
    mag_min: null, mag_max: null,
  });

  const activePsFilters = useMemo(() => {
    const pairs: [keyof PsFilters, keyof PsFilters][] = [
      ["period_min","period_max"],
      ["radius_min","radius_max"],
      ["teff_min","teff_max"],
      ["logg_min","logg_max"],
      ["feh_min","feh_max"],
      ["mag_min","mag_max"],
    ];
    return pairs.reduce((acc, [a, b]) => acc + ((psFilters[a] != null || psFilters[b] != null) ? 1 : 0), 0);
  }, [psFilters]);

  const resetPsFilters = () => setPsFilters({
    period_min: null, period_max: null,
    radius_min: null, radius_max: null,
    teff_min: null, teff_max: null,
    logg_min: null, logg_max: null,
    feh_min: null, feh_max: null,
    mag_min: null, mag_max: null,
  });

  const applyPsFilters = async () => {
    // TODO: reemplazar por POST /datasets (freeze) con filtros PS
    // y usa el ID que te devuelva en lugar de 'custom_freeze'
    setDataset('custom_freeze');
  };

  // ---- Fuente de misión y registros (vista tabla) ----
  const [mission, setMission] = useState<'TESS'|'Kepler'>('TESS');
  const [records, setRecords] = useState<RecordItem[]>(() => sampleRecords.map(r => ({...r, updatedTs: Date.parse(r.updatedAt)})));
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return records.filter(r => r.mission === mission && (search === '' || r.id.toLowerCase().includes(search.toLowerCase())));
  }, [records, mission, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'score') arr.sort((a,b)=> b.proba - a.proba);
    else if (sortBy === 'updatedAt') arr.sort((a,b)=> (b.updatedTs ?? 0) - (a.updatedTs ?? 0));
    else if (sortBy === 'period') arr.sort((a,b)=> a.period - b.period);
    return arr;
  }, [filtered, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRecords = useMemo(()=> sorted.slice((page-1)*pageSize, page*pageSize), [sorted, page]);

  const isSelected = (id: string) => selected.has(id);
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const allSelectedPage = pageRecords.length>0 && pageRecords.every(r => selected.has(r.id));
  const toggleSelectAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelectedPage) pageRecords.forEach(r => next.delete(r.id)); else pageRecords.forEach(r => next.add(r.id));
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());
  const createDatasetFromSelection = () => { setDataset('custom_freeze'); clearSelection(); };
  const loadDemo = () => { setRecords(sampleRecords.map(r => ({...r, updatedTs: Date.parse(r.updatedAt)}))); setPage(1); clearSelection(); };
  const clearDemo = () => { setRecords([]); setPage(1); clearSelection(); };

  // Hiperparámetros RF
  const [rfParams, setRfParams] = useState<RFParams>({
    n_estimators: 300,
    max_depth: null,
    max_features: "sqrt",
    min_samples_split: 4,
    min_samples_leaf: 2,
    class_weight: "balanced",
    bootstrap: true,
  });

  // Hiperparámetros DT
  const [dtParams, setDtParams] = useState<DTParams>({
    criterion: "gini",
    max_depth: null,
    min_samples_split: 4,
    min_samples_leaf: 3,
    max_features: "sqrt",
    ccp_alpha: 0,
  });

  const [rfMetrics, setRfMetrics] = useState<Metrics | null>(null);
  const [dtMetrics, setDtMetrics] = useState<Metrics | null>(null);

  const handleTrainRF = async () => {
    // TODO: sustituir por fetch('/train', { body: { model:'rf', params: rfParams, dataset, featureSchema, groupK, seed } })
    const m = mockTrain("rf", seed + rfParams.n_estimators);
    setRfMetrics(m);
  };

  const handleTrainDT = async () => {
    // TODO: sustituir por fetch('/train', { body: { model:'dt', params: dtParams, dataset, featureSchema, groupK, seed } })
    const m = mockTrain("dt", seed + (dtParams.max_depth || 10));
    setDtMetrics(m);
  };

  const prodMetrics = useMemo<Metrics>(
    () => ({ accuracy: 0.83, precision: 0.81, recall: 0.85, f1: 0.83, rocauc: 0.90, prauc: 0.86 }),
    []
  );

  // ---- Tests ligeros en tiempo de ejecución (sin framework) ----
  function runInternalTests() {
    // formatPct
    console.assert(formatPct(0.123) === '12.3%', 'formatPct debería formatear a 1 decimal');
    // mockTrain rango razonable
    const mrf = mockTrain('rf', 123);
    console.assert(mrf.prauc > 0.7 && mrf.prauc < 0.99, 'mockTrain rf prauc fuera de rango');
    // orden por periodo asc
    const sortedByPeriod = [...sampleRecords].sort((a,b)=> a.period - b.period);
    console.assert(sortedByPeriod[0].period <= sortedByPeriod[1].period, 'sort por periodo debería ser ascendente');
    // slider de umbral mantiene rango 5–95 (UI)
    console.assert(threshold >= 0 && threshold <= 100, 'threshold en rango 0–100');
  }
  useEffect(() => { runInternalTests(); /* se ejecuta una vez al montar */ }, []);

  return (
    <Container fluid p={0} m={0} style={{ minHeight: "100vh", background: "linear-gradient(to bottom, #fff, #f8fafc)" }}>
      {/* Header */}
      <Box pos="sticky" m={0} top={0} style={{ zIndex: 10, backdropFilter: "blur(4px)", background: "rgba(255,255,255,0.8)", borderBottom: "1px solid #eaeaea" }}>
        <Container size="xl" px="md" py="sm">
          <Group justify="space-between">
            <Group gap="sm">
              <Rocket size={24} />
              <Title order={3}>Exoplanet ML Studio</Title>
            </Group>
            <Group gap="md">
              <Group gap="xs" visibleFrom="md">
                <GitBranch size={16} />
                <Text size="sm">Modelo en producción:</Text>
                <Badge color="gray" variant="outline" radius="xl">rf@prod_v3</Badge>
              </Group>
              {/* <Group gap="xs">
                <Gauge size={16} />
                <Text size="sm">Umbral</Text>
                <Box w={120}>
                  <Slider value={threshold} onChange={v => setThreshold(v)} min={5} max={95} step={1} />
                </Box>
                <Text size="sm" style={{ width: rem(40), textAlign: "right" }}>{threshold}%</Text>
              </Group> */}
            </Group>
          </Group>
        </Container>
      </Box>
  
      <Container size="xl" px="md" py="lg">
        <Grid gutter="lg">
          {/* Columna izquierda */}
          <Grid.Col span={{ base: 12, xl: 4 }}>
            <Section title="Configuración del experimento" icon={Settings}>
              <Group grow mb="sm">
                <Button
                  variant={mission === "TESS" ? "filled" : "light"}
                  color="blue"
                  onClick={() => setMission("TESS")}
                >
                  <Text fw={500}>TESS</Text>
                  <Text size="xs" c="dimmed">Sectors • 2-min/20-sec cadence • All-sky</Text>
                </Button>
                <Button
                  variant={mission === "Kepler" ? "filled" : "light"}
                  color="yellow"
                  onClick={() => setMission("Kepler")}
                >
                  <Text fw={500}>Kepler</Text>
                  <Text size="xs" c="dimmed">Quarters • 30-min cadence • Cygnus Field</Text>
                </Button>
              </Group>
              {/* <Select
                label="Dataset"
                data={[
                  { value: "ps+toi_fp_v1", label: "ps+toi_fp_v1" },
                  { value: "ps+toi_fp_v2", label: "ps+toi_fp_v2" },
                  { value: "custom_freeze", label: "custom_freeze" },
                ]}
                value={dataset}
                onChange={(value) => setDataset(value || "")}
                mb="sm"
              /> */}
              {/* <Select
                label="Feature schema"
                data={[
                  { value: "minimal@1", label: "minimal@1" },
                  { value: "comprehensive@1", label: "comprehensive@1" },
                ]}
                value={featureSchema}
                onChange={(value) => setFeatureSchema(value || "")}
                mb="sm"
              /> */}
              <Card withBorder radius="md" mt="sm" mb="sm">
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={500}>Filtros (PS confirmados) — opcional</Text>
                  <Badge variant="outline" radius="xl">Activos: {activePsFilters}</Badge>
                </Group>
                <Grid gutter="xs">
                  <Grid.Col span={6}>
                    <NumberInput label="Periodo [d] min" value={psFilters.period_min ?? ''} onChange={v => setPsFilters({ ...psFilters, period_min: v === '' ? null : Number(v) })} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput label="Periodo [d] max" value={psFilters.period_max ?? ''} onChange={v => setPsFilters({ ...psFilters, period_max: v === '' ? null : Number(v) })} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput label="Radio planeta [R⊕] min" value={psFilters.radius_min ?? ''} onChange={v => setPsFilters({ ...psFilters, radius_min: v === '' ? null : Number(v) })} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput label="Radio planeta [R⊕] max" value={psFilters.radius_max ?? ''} onChange={v => setPsFilters({ ...psFilters, radius_max: v === '' ? null : Number(v) })} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput label="T_eff estrella [K] min" value={psFilters.teff_min ?? ''} onChange={v => setPsFilters({ ...psFilters, teff_min: v === '' ? null : Number(v) })} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput label="T_eff estrella [K] max" value={psFilters.teff_max ?? ''} onChange={v => setPsFilters({ ...psFilters, teff_max: v === '' ? null : Number(v) })} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput label="log g [cgs] min" value={psFilters.logg_min ?? ''} onChange={v => setPsFilters({ ...psFilters, logg_min: v === '' ? null : Number(v) })} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput label="log g [cgs] max" value={psFilters.logg_max ?? ''} onChange={v => setPsFilters({ ...psFilters, logg_max: v === '' ? null : Number(v) })} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput label="[Fe/H] [dex] min" value={psFilters.feh_min ?? ''} onChange={v => setPsFilters({ ...psFilters, feh_min: v === '' ? null : Number(v) })} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput label="[Fe/H] [dex] max" value={psFilters.feh_max ?? ''} onChange={v => setPsFilters({ ...psFilters, feh_max: v === '' ? null : Number(v) })} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput label="Magnitud [mag] min" value={psFilters.mag_min ?? ''} onChange={v => setPsFilters({ ...psFilters, mag_min: v === '' ? null : Number(v) })} />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput label="Magnitud [mag] max" value={psFilters.mag_max ?? ''} onChange={v => setPsFilters({ ...psFilters, mag_max: v === '' ? null : Number(v) })} />
                  </Grid.Col>
                </Grid>
                <Group mt="sm">
                  <Button size="sm" radius="xl" onClick={applyPsFilters}>Aplicar filtros</Button>
                  <Button size="sm" variant="outline" radius="xl" onClick={resetPsFilters}>Limpiar</Button>
                </Group>
                <Text size="xs" c="dimmed" mt="xs">
                  Al aplicar, se creará un dataset congelado (ej. <span style={{ fontFamily: "monospace" }}>custom_freeze</span>) con estos filtros sobre la tabla PS. Sustituye por tu endpoint <span style={{ fontFamily: "monospace" }}>POST /datasets</span>.
                </Text>
              </Card>
              <Grid gutter="xs" mb="sm">
                <Grid.Col span={4}>
                  <NumberInput label="GroupKFold (k)" min={3} max={10} value={groupK} onChange={v => setGroupK(Number(v))} />
                </Grid.Col>
                <Grid.Col span={4}>
                  <NumberInput label="Seed" value={seed} onChange={v => setSeed(Number(v))} />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Group gap="xs" mt="md">
                    <Switch checked label="Modo sandbox" />
                  </Group>
                </Grid.Col>
              </Grid>
            </Section>
  
            <Section title="Métricas del modelo en producción" icon={Activity}>
              <Grid>
                <Grid.Col span={6}><KPI label="PR-AUC" value={prodMetrics.prauc.toFixed(2)} /></Grid.Col>
                <Grid.Col span={6}><KPI label="ROC-AUC" value={prodMetrics.rocauc.toFixed(2)} /></Grid.Col>
                <Grid.Col span={6}><KPI label="Recall" value={formatPct(prodMetrics.recall)} /></Grid.Col>
                <Grid.Col span={6}><KPI label="F1" value={prodMetrics.f1.toFixed(2)} /></Grid.Col>
              </Grid>
              <Box mt="md" h={160}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sampleRoc}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fpr" tickFormatter={(v) => v.toFixed(2)} />
                    <YAxis tickFormatter={(v) => v.toFixed(2)} />
                    <Legend />
                    <Line type="monotone" dataKey="tpr" name="ROC (prod)" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Section>
          </Grid.Col>
  
          {/* Columna derecha */}
          <Grid.Col span={{ base: 12, xl: 8 }}>
            <Section title="Registros precalculados (cache)" icon={Activity}>
              <Group mb="sm" gap="md" wrap="wrap">
                <Box>
                  <Text size="xs">Buscar TIC/KIC</Text>
                  <Input placeholder="Ej. TIC 140123456" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </Box>
                <Box>
                  <Text size="xs">Ordenar por</Text>
                  <Select
                    value={sortBy}
                    data={[
                      { value: "score", label: "Score (desc)" },
                      { value: "updatedAt", label: "Fecha (desc)" },
                      { value: "period", label: "Periodo (asc)" },
                    ]}
                    onChange={(value) => {
                      if (value !== null) {
                        setSortBy(value as SortKey);
                      }
                    }}
                  />
                </Box>
                <Group gap="xs">
                  <Button variant="outline" radius="xl" onClick={loadDemo}>Cargar set de pruebas</Button>
                  <Button variant="outline" radius="xl" onClick={clearDemo}>Vaciar</Button>
                </Group>
                <Group gap="xs">
                  <Badge variant="outline" radius="xl">Sel: {selected.size}</Badge>
                  <Button radius="xl" disabled={selected.size === 0} onClick={createDatasetFromSelection}>Crear dataset desde selección</Button>
                </Group>
              </Group>
              <Box mt="sm" style={{ overflowX: "auto" }}>
                <Table highlightOnHover>
                  <TableThead>
                    <TableTr>
                      <TableTh><input type="checkbox" checked={allSelectedPage} onChange={toggleSelectAll} /></TableTh>
                      <TableTh>ID</TableTh>
                      <TableTh>Mis.</TableTh>
                      <TableTh>mag</TableTh>
                      <TableTh>Periodo [d]</TableTh>
                      <TableTh>Depth [ppm]</TableTh>
                      <TableTh>Dur. [h]</TableTh>
                      <TableTh>BLS SNR</TableTh>
                      <TableTh>Score</TableTh>
                      <TableTh>Etiqueta</TableTh>
                      <TableTh>Actualizado</TableTh>
                    </TableTr>
                  </TableThead>
                  <TableTbody>
                    {pageRecords.map((r) => (
                      <TableTr key={r.id}>
                        <TableTd><input type="checkbox" checked={isSelected(r.id)} onChange={() => toggleSelect(r.id)} /></TableTd>
                        <TableTd style={{ fontFamily: "monospace", fontSize: "12px" }}>{r.id}</TableTd>
                        <TableTd>{r.mission}</TableTd>
                        <TableTd>{r.mag.toFixed(2)}</TableTd>
                        <TableTd>{r.period.toFixed(2)}</TableTd>
                        <TableTd>{r.depth_ppm.toFixed(0)}</TableTd>
                        <TableTd>{r.duration_hr.toFixed(2)}</TableTd>
                        <TableTd>{r.bls_snr.toFixed(1)}</TableTd>
                        <TableTd>
                          <Group gap="xs">
                            <Text>{(r.proba * 100).toFixed(0)}%</Text>
                            <Box h={8} w={64} bg="gray.2" style={{ borderRadius: 4, overflow: "hidden" }}>
                              <Box h={8} bg="blue.4" style={{ width: `${Math.max(8, Math.min(100, r.proba * 100))}%` }} />
                            </Box>
                          </Group>
                        </TableTd>
                        <TableTd>
                          <Badge radius="xl" color={
                            r.label === "confirmed" ? "green" :
                            r.label === "candidate" ? "blue" : "gray"
                          } variant={r.label === "fp" ? "outline" : "filled"}>
                            {r.label}
                          </Badge>
                        </TableTd>
                        <TableTd>{r.updatedAt}</TableTd>
                      </TableTr>
                    ))}
                    {pageRecords.length === 0 && (
                      <TableTr>
                        <TableTd colSpan={11} style={{ textAlign: "center", fontSize: "14px", color: "#888" }}>Sin registros para mostrar.</TableTd>
                      </TableTr>
                    )}
                  </TableTbody>
                </Table>
              </Box>
              <Group mt="sm" justify="space-between">
                <Text size="sm">Mostrando {pageRecords.length} de {sorted.length} registros</Text>
                <Group gap="xs">
                  <Button size="sm" variant="outline" radius="xl" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Anterior</Button>
                  <Text size="sm">{page} / {totalPages}</Text>
                  <Button size="sm" variant="outline" radius="xl" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Siguiente</Button>
                </Group>
              </Group>
            </Section>
  
            <Tabs defaultValue="rf">
              <Tabs.List grow>
                <Tabs.Tab value="rf" leftSection={<Trees size={16} />}>Random Forest</Tabs.Tab>
                <Tabs.Tab value="dt" leftSection={<Shuffle size={16} />}>Decision Tree</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="rf">
                <Section title="Hiperparámetros — Random Forest" icon={FlaskConical}>
                  <Grid gutter="xs">
                    <Grid.Col span={6}>
                      <NumberInput label="n_estimators" min={50} max={1000} step={10} value={rfParams.n_estimators} onChange={v => setRfParams({ ...rfParams, n_estimators: Number(v) })} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput label="max_depth (null = ilimitado)" min={0} max={40} value={rfParams.max_depth ?? 0} onChange={v => setRfParams({ ...rfParams, max_depth: Number(v) === 0 ? null : Number(v) })} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Select label="max_features" data={[
                        { value: "sqrt", label: "sqrt" },
                        { value: "log2", label: "log2" },
                        { value: "auto", label: "auto" },
                      ]} value={rfParams.max_features} onChange={v => setRfParams({ ...rfParams, max_features: v as any })} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput label="min_samples_split" min={2} max={50} value={rfParams.min_samples_split} onChange={v => setRfParams({ ...rfParams, min_samples_split: Number(v) })} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput label="min_samples_leaf" min={1} max={30} value={rfParams.min_samples_leaf} onChange={v => setRfParams({ ...rfParams, min_samples_leaf: Number(v) })} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Group gap="xs" mt="md">
                        <Switch checked={rfParams.bootstrap} label="bootstrap" onChange={e => setRfParams({ ...rfParams, bootstrap: e.currentTarget.checked })} />
                        <Select label="class_weight" data={[
                          { value: "balanced", label: "balanced" },
                          { value: "none", label: "none" },
                        ]} value={rfParams.class_weight} onChange={v => setRfParams({ ...rfParams, class_weight: v as any })} />
                      </Group>
                    </Grid.Col>
                  </Grid>
                  <Group gap="md" mt="md">
                    <Button radius="xl" onClick={handleTrainRF}>Entrenar RF</Button>
                    <Button variant="outline" radius="xl">Comparar vs prod</Button>
                  </Group>
                </Section>
                <Grid gutter="lg" mt="lg">
                  <Grid.Col span={6}>
                    <Section title="Métricas (CV por estrella)" icon={Activity}>
                      <Grid>
                        <Grid.Col span={6}><KPI label="PR-AUC" value={rfMetrics ? rfMetrics.prauc.toFixed(2) : "—"} /></Grid.Col>
                        <Grid.Col span={6}><KPI label="ROC-AUC" value={rfMetrics ? rfMetrics.rocauc.toFixed(2) : "—"} /></Grid.Col>
                        <Grid.Col span={6}><KPI label="Recall" value={rfMetrics ? formatPct(rfMetrics.recall) : "—"} /></Grid.Col>
                        <Grid.Col span={6}><KPI label="F1" value={rfMetrics ? rfMetrics.f1.toFixed(2) : "—"} /></Grid.Col>
                      </Grid>
                      <Box mt="md" h={160}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={samplePr}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="recall" tickFormatter={(v) => v.toFixed(2)} />
                            <YAxis tickFormatter={(v) => v.toFixed(2)} />
                            <Legend />
                            <Area type="monotone" dataKey="precision" name="PR (cv)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                    </Section>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Section title="Importancia de features" icon={FlaskConical}>
                      <Box h={160}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={sampleImportances}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
                            <YAxis tickFormatter={(v) => (v * 100).toFixed(0) + "%"}/>
                            <Legend />
                            <Bar dataKey="value" name="Importancia" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Section>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>
              <Tabs.Panel value="dt">
                <Section title="Hiperparámetros — Decision Tree" icon={FlaskConical}>
                  <Grid gutter="xs">
                    <Grid.Col span={6}>
                      <Select label="criterion" data={[
                        { value: "gini", label: "gini" },
                        { value: "entropy", label: "entropy" },
                      ]} value={dtParams.criterion} onChange={v => setDtParams({ ...dtParams, criterion: v as any })} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput label="max_depth (null = ilimitado)" min={0} max={40} value={dtParams.max_depth ?? 0} onChange={v => setDtParams({ ...dtParams, max_depth: Number(v) === 0 ? null : Number(v) })} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput label="min_samples_split" min={2} max={50} value={dtParams.min_samples_split} onChange={v => setDtParams({ ...dtParams, min_samples_split: Number(v) })} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput label="min_samples_leaf" min={1} max={30} value={dtParams.min_samples_leaf} onChange={v => setDtParams({ ...dtParams, min_samples_leaf: Number(v) })} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Select label="max_features" data={[
                        { value: "sqrt", label: "sqrt" },
                        { value: "log2", label: "log2" },
                        { value: "none", label: "none" },
                      ]} value={dtParams.max_features} onChange={v => setDtParams({ ...dtParams, max_features: v as any })} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput label="ccp_alpha" min={0} max={0.02} step={0.001} value={dtParams.ccp_alpha} onChange={v => setDtParams({ ...dtParams, ccp_alpha: Number(v) })} />
                    </Grid.Col>
                  </Grid>
                  <Group gap="md" mt="md">
                    <Button radius="xl" onClick={handleTrainDT}>Entrenar DT</Button>
                    <Button variant="outline" radius="xl">Comparar vs prod</Button>
                  </Group>
                </Section>
                <Grid gutter="lg" mt="lg">
                  <Grid.Col span={6}>
                    <Section title="Métricas (CV por estrella)" icon={Activity}>
                      <Grid>
                        <Grid.Col span={6}><KPI label="PR-AUC" value={dtMetrics ? dtMetrics.prauc.toFixed(2) : "—"} /></Grid.Col>
                        <Grid.Col span={6}><KPI label="ROC-AUC" value={dtMetrics ? dtMetrics.rocauc.toFixed(2) : "—"} /></Grid.Col>
                        <Grid.Col span={6}><KPI label="Recall" value={dtMetrics ? formatPct(dtMetrics.recall) : "—"} /></Grid.Col>
                        <Grid.Col span={6}><KPI label="F1" value={dtMetrics ? dtMetrics.f1.toFixed(2) : "—"} /></Grid.Col>
                      </Grid>
                      <Box mt="md" h={160}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={sampleRoc}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="fpr" tickFormatter={(v) => v.toFixed(2)} />
                            <YAxis tickFormatter={(v) => v.toFixed(2)} />
                            <Legend />
                            <Line type="monotone" dataKey="tpr" name="ROC (cv)" dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </Section>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Section title="Importancia de features (ejemplo)" icon={FlaskConical}>
                      <Box h={160}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={sampleImportances}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
                            <YAxis tickFormatter={(v) => (v * 100).toFixed(0) + "%"}/>
                            <Legend />
                            <Bar dataKey="value" name="Importancia" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Section>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>
            </Tabs>
  
            <Text mt="lg" mb="md" c="dimmed" size="xs">
              
            </Text>
            <Section title="Tus runs (sandbox)" icon={GitBranch}>
              <Box>
                <Table highlightOnHover>
                  <TableThead>
                    <TableTr>
                      <TableTh>Run</TableTh>
                      <TableTh>Modelo</TableTh>
                      <TableTh>Dataset</TableTh>
                      <TableTh>Features</TableTh>
                      <TableTh>PR-AUC</TableTh>
                      <TableTh>Recall</TableTh>
                      <TableTh>F1</TableTh>
                      <TableTh>Creado</TableTh>
                      <TableTh></TableTh>
                    </TableTr>
                  </TableThead>
                  <TableTbody>
                    {sampleRuns.map((r) => (
                      <TableTr key={r.id}>
                        <TableTd style={{ fontFamily: "monospace", fontSize: "12px" }}>{r.id}</TableTd>
                        <TableTd>{r.model}</TableTd>
                        <TableTd>{r.dataset}</TableTd>
                        <TableTd>{r.featureSchema}</TableTd>
                        <TableTd>{r.prauc.toFixed(2)}</TableTd>
                        <TableTd>{formatPct(r.recall)}</TableTd>
                        <TableTd>{r.f1.toFixed(2)}</TableTd>
                        <TableTd>{r.createdAt}</TableTd>
                        <TableTd>
                          <Group gap="xs" justify="flex-end">
                            <Button size="sm" variant="outline" radius="xl">Comparar</Button>
                            <Button size="sm" radius="xl">Solicitar promoción</Button>
                          </Group>
                        </TableTd>
                      </TableTr>
                    ))}
                  </TableTbody>
                </Table>
              </Box>
            </Section>
          </Grid.Col>
        </Grid>
      </Container>
  
      <Container size="lg" px="md" pb="xl" pt="sm">
        <Text size="xs" c="dimmed">
          * GroupKFold por estrella recomendado. Este MVP muestra gráficas de ejemplo. Sustituye por datos reales del backend (Lightkurve + tsfresh + BLS). Umbral afecta la decisión final en producción.
        </Text>
      </Container>
    </Container>
  );
}