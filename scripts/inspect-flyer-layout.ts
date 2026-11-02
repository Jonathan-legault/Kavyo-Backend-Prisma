
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, parse } from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

// 1. Read the file path supplied in the terminal.
const filePath = process.argv[2];

if (!filePath) {
  throw new Error('Please provide a PDF file path.');
}

// 2. Load the PDF.
const fileBuffer = await readFile(filePath);
const loadingTask = getDocument({
  data: new Uint8Array(fileBuffer),
});

try {
  const pdf = await loadingTask.promise;

  // 3. Get page 1 and its dimensions.
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });

  // 4. Get individual text fragments.
  const textContent = await page.getTextContent();

  const fragments = textContent.items.flatMap((item) => {
    if (!('str' in item) || !item.str.trim()) {
      return [];
    }

    // Convert PDF coordinates into page coordinates.
    const [x, y] = viewport.convertToViewportPoint(
      item.transform[4],
      item.transform[5],
    );

    return [{
      text: item.str.trim(),
      x: Math.round(x),
      y: Math.round(y),
    }];
  });

  // 5. Save the results as JSON.
  const outputPath = join(
    dirname(filePath),
    `${parse(filePath).name}-page-01-layout.json`,
  );

  await writeFile(
    outputPath,
    JSON.stringify(fragments, null, 2),
    'utf8',
  );

  console.log('Page width:', viewport.width);
  console.log('Page height:', viewport.height);
  console.log('Text fragments:', fragments.length);
  console.log('Saved:', outputPath);

  // Show a small sample in the terminal.
  console.table(fragments.slice(0, 20));

  page.cleanup();
} finally {
  await loadingTask.destroy();
}
