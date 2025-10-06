"use client"

import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import React, { useEffect, useMemo, useState } from "react";
import {
  Card, Text, Group, Badge, Button, Input, Select, Switch, Tabs, Table, Slider, NumberInput,
  Title, Container, Grid, Box, Divider, rem,
  TableThead,
  TableTr,
  TableTh,
  TableTbody,
  TableTd,
  MultiSelect,
  Autocomplete,
  Chip,
  Flex,
  ScrollArea
} from "@mantine/core";
import { Rocket, Settings, Activity, FlaskConical, Shuffle, Trees, GitBranch, Gauge } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Legend, AreaChart, Area, BarChart, Bar } from "recharts";
import { columnsByMission, relevantColumnsByMissionCategorical, relevantColumnsByMissionNumerical } from "@/utils/columnsByMission";
import { constellations } from "@/utils/constellations";

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
  proba: number;           // score del Model prod
  label: "confirmed" | "fp" | "candidate";
  updatedAt: string;       // ISO/fecha legible
  updatedTs?: number;      // timestamp precalculado para ordenar
  [key: string]: string | number | "TESS" | "Kepler" | "confirmed" | "fp" | "candidate" | undefined;
};

// ---- Tipos auxiliares ----
type RFParams = {
  N_POINTS: number;
  test_size: number;
  epochs: number;
  optimizer: string;
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
function KPI({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
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

function Section({ title, children, icon: Icon, id }: React.PropsWithChildren<{ title: string; icon?: React.ElementType; id?: string }>) {
  return (
    <Card shadow="sm" padding="md" id={id}>
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
  const [dataset, setDataset] = useState("TOI");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [additionalFilters, setAdditionalFilters] = useState<{ value: string, label: string }[]>([]);
  const [conditionalFilters, setConditionalFilters] = useState<Record<string, number | null>>({});
  const [loadingGetData, setLoadingGetData] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [groupK, setGroupK] = useState(5);
  const [seed, setSeed] = useState(42);
  const [threshold, setThreshold] = useState<number>(50); // 0–100
  const selectAllOption = { value: "*", label: "Sellect All" };
  const options = dataset === "TOI" ? columnsByMission.TESS : columnsByMission.PS;
  const multiSelectData = [selectAllOption, ...options];

  const applyFilters = async () => {
    setLoadingGetData(true);

    const selected = [
      ...new Set([
        ...selectedFilters,
      ])
    ];

    // Build SELECT
    const fields = selected.length > 0 ? selected.join(", ") : "*";

    // Puedes agregar condiciones dinámicas si las tienes en otro objeto
    const conditions = Object.entries(conditionalFilters)
      .filter(([_, value]) => value !== null)
      .map(([key, value]) => {
        if (key.endsWith("_min")) {
          // Remueve el sufijo _min para obtener el nombre de la columna
          const column = key.slice(0, -4);
          return `${column} >= ${value}`;
        } else if (key.endsWith("_max")) {
          // Remueve el sufijo _max para obtener el nombre de la columna
          const column = key.slice(0, -4);
          return `${column} <= ${value}`;
        }
        return "";
      })
      .filter(Boolean);

    // Construye el query completo
    const query = `SELECT ${fields} FROM ${dataset} ${conditions.length ? `WHERE AND ${conditions.join(" AND ")}` : ""}`.trim();
    // const query = 'SELECT TOP 3 tid, toi, toipfx FROM TOI WHERE tid = 259863352'

    const body = {
      query,
      source: dataset === "TOI" ? "TC" : "PS",
      optional_filters: additionalFilters
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    setLoadingGetData(false);
    // Manejo de errores
    if (!response.ok) {
      console.error("Error en la API:", response.statusText);
      setLoadingGetData(false);
      return;
    }


    const { data } = await response.json();

    const inherentColumns = selected.length > 0 ? selected : Object.keys(data?.[0] || {});
    const autoColumns = inherentColumns.includes("predictions")
      ? inherentColumns
      : [...inherentColumns, "predictions"];

    setRecords(data || []);
    setColumns(autoColumns);
    setSelectedColumns(autoColumns);
    setPage(1);
    setLoadingGetData(false);
  };

  const trainingModel = async () => {
    if (records.length === 0) {
      alert("No data to train. Please fetch data first.");
      return;
    }

    setLoadingGetData(true);

    const mappedRecords = records.map(r => ({
      tid: r.tid,
      target: dataset === "TOI" ? r?.tfopwg_disp : 'CP',
      source: dataset,
    }));

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/train`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: mappedRecords,
      }),
    });

    setLoadingGetData(false);
    if (!response.ok) {
      console.error("Error en la API:", response.statusText);
      return;
    }

    const { data } = await response.json();
    console.log("Model entrenado:", data);
  };

  // ---- Fuente de misión y registros (vista tabla) ----
  const [mission, setMission] = useState<'TESS' | 'Kepler'>('TESS');
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [search, setSearch] = useState('TOI');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const displayedColumns = useMemo(() => {
    if (selectedColumns.length > 0) return selectedColumns;
    if (columns.length > 0) return columns;
    if (records.length > 0) return Object.keys(records[0]);
    return [];
  }, [selectedColumns, columns, records]);


  const filtered = useMemo(() => {
    // return records.filter(r => r.mission === mission && (search === '' || r.id.toLowerCase().includes(search.toLowerCase())));
    return records
  }, [records, mission, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'score') arr.sort((a, b) => b.proba - a.proba);
    else if (sortBy === 'updatedAt') arr.sort((a, b) => (b.updatedTs ?? 0) - (a.updatedTs ?? 0));
    else if (sortBy === 'period') arr.sort((a, b) => a.period - b.period);
    return arr;
  }, [filtered, sortBy, records]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRecords = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page, records]);

  const isSelected = (id: string) => selected.has(id);
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const allSelectedPage = pageRecords.length > 0 && pageRecords.every(r => selected.has(r.id));
  const toggleSelectAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelectedPage) pageRecords.forEach(r => next.delete(r.id)); else pageRecords.forEach(r => next.add(r.id));
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());
  const createDatasetFromSelection = () => { setDataset('custom_freeze'); clearSelection(); };
  // const loadDemo = () => { setRecords(sampleRecorerds.map(r => ({ ...r, updatedTs: Date.parse(r.updatedAt) }))); setPage(1); clearSelection(); };
  const clearDemo = () => { setRecords([]); setPage(1); clearSelection(); };

  // Hiperparámetros RF
  const [rfParams, setRfParams] = useState<RFParams>({
    N_POINTS: 300,
    test_size: 0.2,
    epochs: 100,
    optimizer: "adam"
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
    const m = mockTrain("rf", seed + rfParams.N_POINTS);
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
    const sortedByPeriod = [...records].sort((a, b) => a.period - b.period);
    console.assert(sortedByPeriod[0]?.period <= sortedByPeriod[1]?.period, 'sort por periodo debería ser ascendente');
    // slider de umbral mantiene rango 5–95 (UI)
    console.assert(threshold >= 0 && threshold <= 100, 'threshold en rango 0–100');
  }
  useEffect(() => { runInternalTests(); /* se ejecuta una vez al montar */ }, []);

  useEffect(() => {
    setSelectedFilters([]);
  }, [dataset]);

  useEffect(() => {
      driverObj.drive();
  }, []);
  
    const driverObj = driver({
    showProgress: true,
    allowClose: false,
    steps: [
      { element: '#filters', popover: { title: 'Filters Section', description: 'Here you can apply filters to your data.', side: "left", align: 'start' }},
      { element: '#btn-mission-tess', popover: { title: 'Select TESS Mission', description: 'Click here to select the TESS mission.', side: "bottom", align: 'start' }},
      { element: '#btn-mission-kepler', popover: { title: 'Select Kepler Mission', description: 'Click here to select the Kepler mission.', side: "bottom", align: 'start' }},
      { element: '#select-dataset', popover: { title: 'Filter by table TESS or PS', description: 'Click here to select the dataset.', side: "bottom", align: 'start' }},
      { element: '#select-fields', popover: { title: 'Chose the columns you want to filter', description: 'Click here to select the fields.', side: "bottom", align: 'start' }},
      { element: '#additional-filters', popover: { title: 'Additional Filters', description: 'You can filter by various criteria.', side: "bottom", align: 'start' }},
      { element: '#select-constellation', popover: { title: 'Select Constellation', description: 'Click here to select the Constellation.', side: "bottom", align: 'start' }},
      { element: '#btn-apply-filters', popover: { title: 'Apply Filters', description: 'Click here to apply the selected filters.', side: "bottom", align: 'start' }},
      { element: '#prod-metrics', popover: { title: 'Production Metrics', description: 'Click here to view the production metrics.', side: "bottom", align: 'start' }},
    ],
  });

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
                <Text size="sm">Live Model:</Text>
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
          <Grid.Col span={{ base: 12, xl: 4 }} id="filters">
            <Section title="Experiment Filters" icon={Settings}>
              <Group grow mb="sm">
                <Button
                  variant={mission === "TESS" ? "filled" : "light"}
                  color="blue"
                  onClick={() => setMission("TESS")}
                  id="btn-mission-tess"
                >
                  <Text fw={500}>TESS</Text>
                  {/* <Text size="xs" c="dimmed">Sectors • 2-min/20-sec cadence • All-sky</Text> */}
                </Button>
                <Button
                  variant={mission === "Kepler" ? "filled" : "light"}
                  color="yellow"
                  onClick={() => setMission("Kepler")}
                  id="btn-mission-kepler"
                >
                  <Text fw={500}>Kepler</Text>
                  {/* <Text size="xs" c="dimmed">Quarters • 30-min cadence • Cygnus Field</Text> */}
                </Button>
              </Group>
              <Card withBorder radius="md" mt="sm" mb="sm">
                <Select
                  label="Table"
                  data={[
                    { value: "TOI", label: "TOI" },
                    { value: "PS", label: "PS (Confirmed)" },
                  ]}
                  value={dataset}
                  onChange={(value) => setDataset(value || "")}
                  mb="sm"
                  id="select-dataset"
                />

                <MultiSelect
                  label="Fields"
                  data={multiSelectData}
                  value={selectedFilters}
                  onChange={(values: string[]) => {
                    if (values.includes("*")) {
                      if (selectedFilters.length === options.length) {
                        setSelectedFilters([]);
                      } else {
                        setSelectedFilters(options.map(opt => opt.value));
                      }
                    } else {
                      setSelectedFilters(values);
                    }
                  }}
                  searchable
                  clearable
                  id="select-fields"
                  styles={{
                    input: {
                      maxHeight: 100,
                      overflowY: "auto",
                      display: "flex",
                      flexWrap: "wrap",
                      alignContent: "flex-start",
                    },
                  }}
                  mb="sm"
                />
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={500}>Additional Filters</Text>
                  <Badge variant="outline" radius="xl">Active Filters: {additionalFilters.length}</Badge>
                </Group>
                <Grid gutter="xs" id="additional-filters">
                  <Grid.Col span={12}>
                    <Flex align={'center'} justify={'start'} h={'100%'}>
                      <Switch labelPosition="left" label="Controversial" checked={additionalFilters.some(f => f.label === 'Controversial')} onChange={e => {
                        if (e.currentTarget.checked) {
                          setAdditionalFilters(prev => [...prev, { label: 'Controversial', value: 'true' }]);
                        } else {
                          setAdditionalFilters(prev => prev.filter(f => f.label !== 'Controversial'));
                        }
                      }} />
                    </Flex>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Select
                      label="Author"
                      data={[
                        { value: "TESS-SPOC", label: "TESS-SPOC" },
                        { value: "SPOC", label: "SPOC" },
                      ]}
                      value={additionalFilters.find(f => f.label === 'Author')?.value ?? ''}
                      onChange={(value) => setAdditionalFilters(prev => {
                        const safeValue = value ?? '';
                        const existing = prev.find(f => f.label === 'Author');
                        if (existing) {
                          return prev.map(f => f.label === 'Author' ? { ...f, value: safeValue } : f);
                        }
                        return [...prev, { label: 'Author', value: safeValue }];
                      })}
                      mb="sm"
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Autocomplete id="select-constellation" data={constellations} label="Constellation" value={additionalFilters.find(f => f.label === 'Constellation')?.value ?? ''} onChange={v => setAdditionalFilters(prev => {
                      const existing = prev.find(f => f.label === 'Constellation');
                      if (existing) {
                        return prev.map(f => f.label === 'Constellation' ? { ...f, value: v } : f);
                      }
                      return [...prev, { label: 'Constellation', value: v }];
                    })} />
                  </Grid.Col>
                  {(dataset === "TOI"
                    ? relevantColumnsByMissionNumerical.TESS
                    : relevantColumnsByMissionNumerical.PS
                  ).map((col, idx) => (
                    <React.Fragment key={col.value + idx}>
                      <Grid.Col span={6}>
                        <NumberInput
                          label={`${col.label} min`}
                          value={conditionalFilters[`${col.value}_min`] ?? ''}
                          onChange={(v) =>
                            setConditionalFilters((prev) => ({
                              ...prev,
                              [`${col.value}_min`]: v === '' ? null : Number(v)
                            }))
                          }
                          min={0}
                          step={0.1}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <NumberInput
                          label={`${col.label} max`}
                          value={conditionalFilters[`${col.value}_max`] ?? ''}
                          onChange={(v) =>
                            setConditionalFilters((prev) => ({
                              ...prev,
                              [`${col.value}_max`]: v === '' ? null : Number(v)
                            }))
                          }
                          min={0}
                          step={0.1}
                        />
                      </Grid.Col>
                    </React.Fragment>
                  ))}

                </Grid>
                <Group mt="sm">
                  <Button loading={loadingGetData} id="btn-apply-filters" size="sm" radius="xl" onClick={applyFilters}>Apply Filters</Button>
                  {/* <Button size="sm" variant="outline" radius="xl" onClick={resetPsFilters}>Limpiar</Button> */}
                </Group>
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
                    <Switch checked label="Sandbox Mode" />
                  </Group>
                </Grid.Col>
              </Grid>
            </Section>

            <Section title="Model Metrics in Production" icon={Activity} id="prod-metrics">
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
            <Section title="Precalculated Records (cache)" icon={Activity}>
              <Text c="dimmed" size="xs" mb="sm">This is a demo due to limited GPU/CPU resources.</Text>
              <Group mb="sm" gap="md" wrap="wrap">
                <Box>
                  <Text size="xs">Search TIC/KIC</Text>
                  <Input placeholder="Ej. TIC 140123456" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </Box>
                <Box>
                  <Text size="xs">Sort by</Text>
                  <Select
                    value={sortBy}
                    data={[
                      { value: "score", label: "Score (desc)" },
                      { value: "updatedAt", label: "Date (desc)" },
                      { value: "period", label: "Period (asc)" },
                    ]}
                    onChange={(value) => {
                      if (value !== null) {
                        setSortBy(value as SortKey);
                      }
                    }}
                  />
                </Box>
              </Group>
              <div>
                <MultiSelect
                  label="Columns"
                  data={multiSelectData}
                  value={selectedColumns}
                  onChange={(values: string[]) => {
                    if (values.includes("*")) {
                      if (selectedColumns.length === options.length) {
                        setSelectedColumns([]);
                      } else {
                        setSelectedColumns(options.map(opt => opt.value));
                      }
                    } else {
                      setSelectedColumns(values);
                    }
                  }}
                  searchable
                  clearable
                  styles={{
                    input: {
                      maxHeight: 36,
                      // maxWidth: 300,
                      overflowY: "auto",
                      display: "flex",
                      flexWrap: "wrap",
                      alignContent: "flex-start",
                    },
                  }}
                  mb="sm"
                />
              </div>
              <Box mt="sm" style={{ overflowX: "auto" }}>
                <ScrollArea w={800} h={'auto'}>
                  <Table highlightOnHover withTableBorder withColumnBorders>
                    <TableThead>
                      <TableTr>
                        <TableTh w={40}>
                          <input
                            type="checkbox"
                            checked={allSelectedPage}
                            onChange={toggleSelectAll}
                          />
                        </TableTh>

                        {/* Encabezados dinámicos */}
                        {displayedColumns.map((col) => (
                          <TableTh key={col}>
                            {col.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                          </TableTh>
                        ))}

                      </TableTr>
                    </TableThead>

                    <TableTbody>
                      {pageRecords.map((r, idx) => (
                        <TableTr key={r.id || idx}>
                          {/* Checkbox */}
                          <TableTd w={40}>
                            <input
                              type="checkbox"
                              checked={isSelected(r.id)}
                              onChange={() => toggleSelect(r.id)}
                            />
                          </TableTd>

                          {/* Columnas dinámicas */}
                          {displayedColumns.map((col) => {
                            const value = r[col];

                            return (
                              <TableTd key={col} fz="sm">
                                {value !== null && value !== undefined ? String(value) : "—"}
                              </TableTd>
                            );
                          })}
                        </TableTr>
                      ))}
                    </TableTbody>


                  </Table>
                </ScrollArea>
              </Box>
              <Group mt="sm" justify="space-between">
                <Text size="sm">Showing {pageRecords.length} of {sorted.length} records</Text>
                <Group gap="xs">
                  <Button size="sm" variant="outline" radius="xl" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Previous</Button>
                  <Text size="sm">{page} / {totalPages}</Text>
                  <Button size="sm" variant="outline" radius="xl" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</Button>
                </Group>
              </Group>
            </Section>

            <Tabs defaultValue="rf">
              <Tabs.List grow>
                <Tabs.Tab value="rf" leftSection={<Trees size={16} />}>Deep Learning</Tabs.Tab>
                <Tabs.Tab value="dt" leftSection={<Shuffle size={16} />}>Decision Tree</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="rf">
                <Section title="Hyperparameters — Deep Learning" icon={FlaskConical}>
                  <Grid gutter="xs">
                    <Grid.Col span={6}>
                      <NumberInput label="N Points" min={50} max={1000} step={10} value={rfParams.N_POINTS} onChange={v => setRfParams({ ...rfParams, N_POINTS: Number(v) })} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput label="Test data size" min={0} max={1} value={rfParams.test_size ?? 0} onChange={v => setRfParams({ ...rfParams, test_size: Number(v) })} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput label="Epochs" min={2} max={50} value={rfParams.epochs} onChange={v => setRfParams({ ...rfParams, epochs: Number(v) })} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Select label="Optimizer" data={[
                        { value: "adam", label: "adam" },
                        { value: "sgd", label: "sgd" },
                        { value: "rmsprop", label: "rmsprop" },
                        { value: "adamax", label: "adamax" },
                        { value: "nadam", label: "nadam" },
                      ]} value={rfParams.optimizer} onChange={v => setRfParams({ ...rfParams, optimizer: v as string })} />
                    </Grid.Col>
                  </Grid>
                  <Group gap="md" mt="md">
                    <Button radius="xl" onClick={trainingModel}>Train</Button>
                    <Button variant="outline" radius="xl">Compare vs prod</Button>
                  </Group>
                </Section>
                <Grid gutter="lg" mt="lg">
                  <Grid.Col span={6}>
                    <Section title="Metrics (CV by Star)" icon={Activity}>
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
                    <Section title="Feature Importance" icon={FlaskConical}>
                      <Box h={160}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={sampleImportances}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
                            <YAxis tickFormatter={(v) => (v * 100).toFixed(0) + "%"} />
                            <Legend />
                            <Bar dataKey="value" name="Importance" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Section>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>
              <Tabs.Panel value="dt">
                <Section title="Hyperparameters — Decision Tree" icon={FlaskConical}>
                  <Grid gutter="xs">
                    <Grid.Col span={6}>
                      <NumberInput label="max_depth (null = unlimited)" min={0} max={40} value={dtParams.max_depth ?? 0} onChange={v => setDtParams({ ...dtParams, max_depth: Number(v) === 0 ? null : Number(v) })} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput label="min_samples_split" min={2} max={50} value={dtParams.min_samples_split} onChange={v => setDtParams({ ...dtParams, min_samples_split: Number(v) })} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput label="min_samples_leaf" min={1} max={30} value={dtParams.min_samples_leaf} onChange={v => setDtParams({ ...dtParams, min_samples_leaf: Number(v) })} />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput label="ccp_alpha" min={0} max={0.02} step={0.001} value={dtParams.ccp_alpha} onChange={v => setDtParams({ ...dtParams, ccp_alpha: Number(v) })} />
                    </Grid.Col>
                  </Grid>
                  <Group gap="md" mt="md">
                    <Button radius="xl" onClick={handleTrainDT}>Train DT</Button>
                    <Button variant="outline" radius="xl">Compare vs prod</Button>
                  </Group>
                </Section>
                <Grid gutter="lg" mt="lg">
                  <Grid.Col span={6}>
                    <Section title="MMetrics (CV by Star)" icon={Activity}>
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
                    <Section title="Feature Importance (example)" icon={FlaskConical}>
                      <Box h={160}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={sampleImportances}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
                            <YAxis tickFormatter={(v) => (v * 100).toFixed(0) + "%"} />
                            <Legend />
                            <Bar dataKey="value" name="Importance" />
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
            <Section title="Your runs (sandbox)" icon={GitBranch}>
              <Box>
                <Table highlightOnHover>
                  <TableThead>
                    <TableTr>
                      <TableTh>Run</TableTh>
                      <TableTh>Model</TableTh>
                      <TableTh>Dataset</TableTh>
                      <TableTh>Features</TableTh>
                      <TableTh>PR-AUC</TableTh>
                      <TableTh>Recall</TableTh>
                      <TableTh>F1</TableTh>
                      <TableTh>Created</TableTh>
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
                            <Button size="sm" variant="outline" radius="xl">Compare</Button>
                            <Button size="sm" radius="xl">Request Promotion</Button>
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

    </Container>
  );
}