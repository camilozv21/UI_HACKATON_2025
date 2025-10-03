"use client"

import { setFilters } from '@/lib/features/filters';
import { useAppDispatch } from '@/lib/hooks';
import { columnsByMission } from '@/utils/columnsByMission';
import { Button, Flex, NumberInput, Select, TextInput, MultiSelect, Table, Pagination, Paper, Center } from '@mantine/core';
import { useForm } from '@mantine/form';
import React, { useState } from 'react'
import Papa from 'papaparse';

const PAGE_SIZE = 15;

export default function Filters() {
  const dispatch = useAppDispatch();
  const [mission, setMission] = useState<'TESS' | 'K2'>('TESS');
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      project: 'TESS',
      columns: []
    },
  });

  const handleMissionChange = (value: 'TESS' | 'K2') => {
    setMission(value);
    form.setFieldValue('project', value);
    form.setFieldValue('columns', []);
    setTableData([]);
    setColumns([]);
  };

  const handleSubmit = async (values: any) => {
    dispatch(setFilters(values));
    setTableData([]);
    setColumns([]);
    try {
      const response = await fetch('/api/bring-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project: values.project,
          columns: values.columns
        })
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const csv = await response.text();
      // Parse CSV to JSON
      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
      setTableData(parsed.data as any[]);
      setColumns(values.columns);
      setPage(1);
    } catch (error) {
      alert('Error al traer los datos');
      console.error(error);
    }
  };

  const paginatedData = tableData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
        <Flex justify="center" gap='sm'>

          <Select
            label="Misión"
            data={[
              { value: 'TESS', label: 'TESS' },
              { value: 'K2', label: 'K2' }
            ]}
            value={mission}
            onChange={(value) => {
              if (!value) return;
              handleMissionChange(value as 'TESS' | 'K2');
            }}
            style={{ width: 120 }}
            clearable={false}
          />
          <MultiSelect
            label="Columnas"
            placeholder="Selecciona columnas"
            data={columnsByMission[mission]}
            {...form.getInputProps('columns')}
            style={{ minWidth: 200, maxWidth: 500 }}
            searchable
            clearable
            checkIconPosition="right"
          />

          <Button type='submit' color='var(--primary-color)' style={{ alignSelf: 'end' }}>
            Bring Data
          </Button>
        </Flex>
      </form>

      {tableData.length > 0 && (
        <>
          <Paper shadow='sm' radius="md" m="xl">
            <Table
              withColumnBorders
              highlightOnHover
              striped
              stickyHeader
            >
              <Table.Thead>
                <Table.Tr>
                  {columns.map((col) => (
                    <Table.Th key={col}>{col}</Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <tbody>
                {paginatedData.map((row, idx) => (
                  <Table.Tr key={idx}>
                    {columns.map((col) => (
                      <Table.Td key={col}>{row[col]}</Table.Td>
                    ))}
                  </Table.Tr>
                ))}
              </tbody>
            </Table>
            <Center>
              <Pagination
                total={Math.ceil(tableData.length / PAGE_SIZE)}
                value={page}
                onChange={setPage}
                my="md"
                color='var(--primary-color)'
              />
            </Center>
          </Paper>
        </>
      )}
    </>
  )
}
