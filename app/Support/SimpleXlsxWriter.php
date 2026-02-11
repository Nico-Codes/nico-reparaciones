<?php

namespace App\Support;

use RuntimeException;
use ZipArchive;

class SimpleXlsxWriter
{
    /**
     * @param  array<int, array<int, string>>  $rows
     */
    public function build(array $rows, string $sheetName = 'Reporte'): string
    {
        $tmpPath = tempnam(sys_get_temp_dir(), 'xlsx_');
        if ($tmpPath === false) {
            throw new RuntimeException('Could not create temporary XLSX file.');
        }

        $zip = new ZipArchive;
        if ($zip->open($tmpPath, ZipArchive::OVERWRITE) !== true) {
            @unlink($tmpPath);
            throw new RuntimeException('Could not open ZIP archive for XLSX generation.');
        }

        $zip->addFromString('[Content_Types].xml', $this->contentTypesXml());
        $zip->addFromString('_rels/.rels', $this->rootRelationshipsXml());
        $zip->addFromString('xl/workbook.xml', $this->workbookXml($sheetName));
        $zip->addFromString('xl/_rels/workbook.xml.rels', $this->workbookRelationshipsXml());
        $zip->addFromString('xl/worksheets/sheet1.xml', $this->sheetXml($rows));
        $zip->close();

        $binary = file_get_contents($tmpPath);
        @unlink($tmpPath);

        if ($binary === false) {
            throw new RuntimeException('Could not read generated XLSX file.');
        }

        return $binary;
    }

    private function contentTypesXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>
XML;
    }

    private function rootRelationshipsXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>
XML;
    }

    private function workbookRelationshipsXml(): string
    {
        return <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>
XML;
    }

    private function workbookXml(string $sheetName): string
    {
        $safeName = $this->escapeXml(trim($sheetName) !== '' ? $sheetName : 'Reporte');

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="{$safeName}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>
XML;
    }

    /**
     * @param  array<int, array<int, string>>  $rows
     */
    private function sheetXml(array $rows): string
    {
        $xmlRows = [];
        foreach ($rows as $rowIndex => $row) {
            $excelRow = $rowIndex + 2;
            $cells = [];
            foreach ($row as $cellIndex => $value) {
                $column = $this->columnIndexToName($cellIndex);
                $ref = $column.$excelRow;
                $value = (string) $value;

                if ($this->isNumericCell($value)) {
                    $cells[] = '<c r="'.$ref.'"><v>'.$this->escapeXml($value).'</v></c>';

                    continue;
                }

                $cells[] = '<c r="'.$ref.'" t="inlineStr"><is><t>'.$this->escapeXml($value).'</t></is></c>';
            }
            $xmlRows[] = '<row r="'.$excelRow.'">'.implode('', $cells).'</row>';
        }

        $headerRow = '<row r="1">'
            .'<c r="A1" t="inlineStr"><is><t>seccion</t></is></c>'
            .'<c r="B1" t="inlineStr"><is><t>metrica</t></is></c>'
            .'<c r="C1" t="inlineStr"><is><t>valor</t></is></c>'
            .'<c r="D1" t="inlineStr"><is><t>unidad</t></is></c>'
            .'<c r="E1" t="inlineStr"><is><t>detalle</t></is></c>'
            .'</row>';

        $allRows = $headerRow.implode('', $xmlRows);

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    {$allRows}
  </sheetData>
</worksheet>
XML;
    }

    private function isNumericCell(string $value): bool
    {
        return preg_match('/^-?\d+(?:\.\d+)?$/', trim($value)) === 1;
    }

    private function columnIndexToName(int $index): string
    {
        $index += 1;
        $name = '';

        while ($index > 0) {
            $mod = ($index - 1) % 26;
            $name = chr(65 + $mod).$name;
            $index = intdiv($index - 1, 26);
        }

        return $name;
    }

    private function escapeXml(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }
}
