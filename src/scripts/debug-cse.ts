import { getStockPrice, getCompanyInfo } from "../lib/cse-api";

async function main() {
  const symbol = "HNB.N0000";
  console.log(`Debugging data for ${symbol}...`);

  try {
    const priceRes = await getStockPrice(symbol);
    console.log("Price API Response:", JSON.stringify(priceRes, null, 2));

    const infoRes = await getCompanyInfo(symbol);
    console.log("Info API Response:", JSON.stringify(infoRes, null, 2));
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
