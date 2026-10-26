
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, parse } from 'node:path';
import { PDFParse } from 'pdf-parse';

// Get the PDF location from the command line.
const filePath = process.argv[2];

if (!filePath) {
  throw new Error('Please provide a PDF file path.');
}

// Load the PDF.
const pdfBuffer = await readFile(filePath);
const parser = new PDFParse({ data: pdfBuffer });

try {
  // Extract the text from page 1.
  const textResult = await parser.getText({
    partial: [1],
  });

  const pageText = textResult.pages[0]?.text ?? '';

  console.log('PDF:', filePath);
  console.log('Text characters:', pageText.length);
  console.log(pageText.slice(0, 2000));

  // Render page 1 as an image.
  const imageResult = await parser.getScreenshot({
    partial: [1],
    scale: 1.5,
  });

  const pageImage = imageResult.pages[0];

  if (!pageImage?.data) {
    throw new Error('Could not render page 1.');
  }

  // Save the PNG beside the original PDF.
  const outputPath = join(
    dirname(filePath),
    `${parse(filePath).name}-page-01.png`,
  );

  await writeFile(outputPath, pageImage.data);

  console.log('Page image saved to:', outputPath);

} finally {
  await parser.destroy();
}
