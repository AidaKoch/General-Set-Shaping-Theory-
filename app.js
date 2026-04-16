"use strict";

const form = document.querySelector("#shaping-form");
const alphabetInput = document.querySelector("#alphabet");
const lengthNInput = document.querySelector("#length-n");
const lengthKInput = document.querySelector("#length-k");
const maxExpandedInput = document.querySelector("#max-expanded");
const summary = document.querySelector("#summary");
const mappingBody = document.querySelector("#mapping-body");
const previewNote = document.querySelector("#preview-note");
const downloadButton = document.querySelector("#download-xls");

let latestResult = null;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculateMapping();
});

downloadButton.addEventListener("click", () => {
  if (!latestResult) {
    return;
  }

  downloadExcel(latestResult);
});

function calculateMapping() {
  try {
    setStatus("Calcolo in corso...");
    downloadButton.disabled = true;

    const alphabet = parseAlphabet(alphabetInput.value);
    const n = parseInteger(lengthNInput.value, "N", 1);
    const k = parseInteger(lengthKInput.value, "K", 0);
    const maxExpanded = parseInteger(maxExpandedInput.value, "limite calcolo", 1);
    const sourceCount = power(alphabet.length, n);
    const expandedCount = power(alphabet.length, n + k);

    if (sourceCount > maxExpanded) {
      throw new Error(`A^N vale ${formatNumber(sourceCount)}: aumenta il limite calcolo o riduci A/N.`);
    }

    if (expandedCount > maxExpanded) {
      throw new Error(`A^(N+K) vale ${formatNumber(expandedCount)}: aumenta il limite calcolo o riduci A/N/K.`);
    }

    const sourceRows = buildRankedRows(alphabet, n, n).sort(compareRows);
    const expandedRows = buildRankedRows(alphabet, n + k, n + k).sort(compareRows);
    const selectedExpandedRows = expandedRows.slice(0, sourceRows.length);
    const mapping = sourceRows.map((source, index) => {
      const target = selectedExpandedRows[index];
      return {
        rank: index + 1,
        source,
        target,
      };
    });

    latestResult = {
      alphabet,
      n,
      k,
      sourceRows,
      selectedExpandedRows,
      mapping,
      generatedAt: new Date(),
    };

    renderSummary({
      sourceCount,
      expandedCount,
      mappingCount: mapping.length,
      state: "Completato",
      isError: false,
    });
    renderPreview(mapping);
    previewNote.textContent = `Mostrate le prime ${Math.min(mapping.length, 200)} corrispondenze su ${formatNumber(mapping.length)}.`;
    downloadButton.disabled = false;
  } catch (error) {
    latestResult = null;
    renderSummary({
      sourceCount: "-",
      expandedCount: "-",
      mappingCount: "-",
      state: error.message,
      isError: true,
    });
    renderEmpty(error.message, true);
    previewNote.textContent = "Correggi i parametri e riprova.";
  }
}

function parseAlphabet(rawValue) {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    throw new Error("Inserisci almeno un simbolo nell'alfabeto.");
  }

  const symbols = trimmed.includes(",")
    ? trimmed.split(",").map((symbol) => symbol.trim()).filter(Boolean)
    : Array.from(trimmed).filter((symbol) => !/\s/.test(symbol));

  const uniqueSymbols = [...new Set(symbols)];

  if (uniqueSymbols.length < 2) {
    throw new Error("L'alfabeto deve contenere almeno due simboli distinti.");
  }

  if (uniqueSymbols.some((symbol) => symbol.length === 0)) {
    throw new Error("Uno dei simboli dell'alfabeto e vuoto.");
  }

  return uniqueSymbols;
}

function parseInteger(value, label, minimum) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new Error(`${label} deve essere un intero maggiore o uguale a ${minimum}.`);
  }

  return parsed;
}

function power(base, exponent) {
  const value = base ** exponent;

  if (!Number.isSafeInteger(value)) {
    throw new Error("Il numero di sequenze supera la precisione sicura del browser.");
  }

  return value;
}

function buildRankedRows(alphabet, length, multiplier) {
  const rows = [];
  const counts = Array(alphabet.length).fill(0);
  const sequence = Array(length);

  function visit(position) {
    if (position === length) {
      const text = sequenceToText(alphabet, sequence);
      const entropy = empiricalEntropy(counts, length);
      rows.push({
        sequence: text,
        entropy,
        scaledEntropy: multiplier * entropy,
        frequencies: formatFrequencies(alphabet, counts, length),
      });
      return;
    }

    for (let index = 0; index < alphabet.length; index += 1) {
      sequence[position] = alphabet[index];
      counts[index] += 1;
      visit(position + 1);
      counts[index] -= 1;
    }
  }

  visit(0);
  return rows;
}

function sequenceToText(alphabet, sequence) {
  const hasLongSymbols = alphabet.some((symbol) => symbol.length > 1);
  return hasLongSymbols ? sequence.join(" ") : sequence.join("");
}

function empiricalEntropy(counts, length) {
  if (length === 0) {
    return 0;
  }

  return counts.reduce((sum, count) => {
    if (count === 0) {
      return sum;
    }

    const probability = count / length;
    return sum - probability * Math.log2(probability);
  }, 0);
}

function formatFrequencies(alphabet, counts, length) {
  return alphabet
    .map((symbol, index) => {
      const probability = length === 0 ? 0 : counts[index] / length;
      return `${symbol}:${counts[index]}/${length}=${formatDecimal(probability)}`;
    })
    .join(" | ");
}

function compareRows(left, right) {
  if (left.scaledEntropy !== right.scaledEntropy) {
    return left.scaledEntropy - right.scaledEntropy;
  }

  return left.sequence.localeCompare(right.sequence, "it");
}

function renderSummary({ sourceCount, expandedCount, mappingCount, state, isError }) {
  const values = summary.querySelectorAll("dd");
  values[0].textContent = typeof sourceCount === "number" ? formatNumber(sourceCount) : sourceCount;
  values[1].textContent = typeof expandedCount === "number" ? formatNumber(expandedCount) : expandedCount;
  values[2].textContent = typeof mappingCount === "number" ? formatNumber(mappingCount) : mappingCount;
  values[3].textContent = state;
  values[3].classList.toggle("error", isError);
}

function setStatus(state) {
  const values = summary.querySelectorAll("dd");
  values[3].textContent = state;
  values[3].classList.remove("error");
}

function renderPreview(mapping) {
  const previewRows = mapping.slice(0, 200);
  mappingBody.innerHTML = previewRows.map((row) => `
    <tr>
      <td>${row.rank}</td>
      <td>${escapeHtml(row.source.sequence)}</td>
      <td>${formatDecimal(row.source.scaledEntropy)}</td>
      <td>${escapeHtml(row.target.sequence)}</td>
      <td>${formatDecimal(row.target.scaledEntropy)}</td>
      <td>${escapeHtml(row.target.frequencies)}</td>
    </tr>
  `).join("");
}

function renderEmpty(message, isError = false) {
  mappingBody.innerHTML = `
    <tr>
      <td colspan="6" class="${isError ? "error" : ""}">${escapeHtml(message)}</td>
    </tr>
  `;
}

function downloadExcel(result) {
  const rows = [
    [
      "Rank",
      "Sequenza iniziale",
      "Frequenze iniziali",
      "H0 iniziale",
      "N*H0 iniziale",
      "Sequenza espansa",
      "Frequenze espanse",
      "H0 espansa",
      "(N+K)*H0 espansa",
    ],
    ...result.mapping.map((row) => [
      row.rank,
      row.source.sequence,
      row.source.frequencies,
      formatDecimal(row.source.entropy),
      formatDecimal(row.source.scaledEntropy),
      row.target.sequence,
      row.target.frequencies,
      formatDecimal(row.target.entropy),
      formatDecimal(row.target.scaledEntropy),
    ]),
  ];

  const metadata = [
    ["Parametro", "Valore"],
    ["Alfabeto", result.alphabet.join(", ")],
    ["N", result.n],
    ["K", result.k],
    ["Sequenze iniziali", result.sourceRows.length],
    ["Sequenze espanse selezionate", result.selectedExpandedRows.length],
    ["Generato il", result.generatedAt.toLocaleString("it-IT")],
    [],
  ];

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Mapping</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        ${tableToHtml(metadata)}
        ${tableToHtml(rows)}
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const link = document.createElement("a");
  const filename = `set-shaping-A${result.alphabet.length}-N${result.n}-K${result.k}.xls`;
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function tableToHtml(rows) {
  return `
    <table border="1">
      ${rows.map((row) => `
        <tr>
          ${row.map((cell) => `<td>${escapeHtml(String(cell ?? ""))}</td>`).join("")}
        </tr>
      `).join("")}
    </table>
    <br>
  `;
}

function formatNumber(value) {
  return new Intl.NumberFormat("it-IT").format(value);
}

function formatDecimal(value) {
  return Number(value).toFixed(6);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

calculateMapping();
