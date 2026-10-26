
import { readFile } from 'node:fs/promises';

// Structure of one extracted PDF text fragment.
interface TextFragment {
  text: string;
  x: number;
  y: number;
}

// Get the JSON file and search term.
const filePath = process.argv[2];
const searchTerm = process.argv[3] ?? 'Oikos';

if (!filePath) {
  throw new Error('Please provide a layout JSON file.');
}

// Load the positioned text fragments.
const fileContent = await readFile(filePath, 'utf8');

const fragments: TextFragment[] = JSON.parse(fileContent);

// Find fragments containing our search term.
const matches = fragments.filter((fragment) =>
  fragment.text.toLowerCase().includes(
    searchTerm.toLowerCase(),
  ),
);

console.log('Searching for:', searchTerm);
console.log('Matches found:', matches.length);

// Examine the text around each match.
for (const match of matches) {
  console.log('\nProduct fragment:', match);

  const nearby = fragments.filter((fragment) => {
    const horizontalDistance = Math.abs(fragment.x - match.x);
    const verticalDistance = Math.abs(fragment.y - match.y);

    return (
      horizontalDistance <= 180 &&
      verticalDistance <= 100
    );
  });

  // Sort top to bottom, then left to right.
  nearby.sort((a, b) => a.y - b.y || a.x - b.x);

  console.table(nearby);

  // Find possible dollar amounts to the left of the product.
  const dollarParts = nearby.filter((fragment) => {
    return (
      /^\d{1,3}$/.test(fragment.text) &&
      fragment.x < match.x &&
      match.x - fragment.x <= 130 &&
      Math.abs(fragment.y - match.y) <= 45
    );
  });

  // Look for cents positioned beside each dollar amount.
  const priceCandidates = dollarParts.flatMap((dollar) => {
    const centsParts = nearby.filter((fragment) => {
      return (
        /^\d{2}$/.test(fragment.text) &&
        fragment.x > dollar.x &&
        fragment.x - dollar.x <= 45 &&
        fragment.x < match.x &&
        Math.abs(fragment.y - dollar.y) <= 25
      );
    });

    return centsParts.map((cents) => ({
      price: `${dollar.text}.${cents.text}`,
      dollarX: dollar.x,
      centsX: cents.x,
      distanceFromProduct: match.x - cents.x,
    }));
  });

  // Show the closest candidate first.
  priceCandidates.sort(
    (a, b) => a.distanceFromProduct - b.distanceFromProduct,
  );

  console.log('\nPossible prices:');
  console.table(priceCandidates);
}
