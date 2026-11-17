import { FlippClient } from "./src/flyers/flipp/flipp.client.ts";

async function main() {
  const client = new FlippClient({
    postalCode: "T3M1T4",
    locale: "en-ca",
  });

  console.log("Requesting flyer 8205958...");

  const flyer = await client.getFlyer(8205958);

  console.log("Number of items:", flyer.items.length);

  const item = flyer.items.find(
    (entry) => entry.id === 1049922614
  );

  if (!item) {
    console.log("Sausage Meat item was not found.");
    return;
  }

  console.log("\nItem found:");
  console.log(JSON.stringify(item, null, 2));

  console.log("\nRequesting item details...");
  const detail = await client.getItem(item.id);

  console.log("\nItem details:");
  console.log(JSON.stringify(detail, null, 2));
}

main().catch((error) => {
  console.error("Retrieval failed:", error.message);
  process.exitCode = 1;
});
