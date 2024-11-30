import { readdirSync, lstatSync, readFileSync } from "fs";
import { join, extname } from "path";
import { MongoClient } from "mongodb";

// MongoDB connection details
const uri = "mongodb://localhost:27017/"; // MongoDB connection string
const dbName = "orbda"; // Replace with your DB name

// Function to recursively traverse directories and handle JSON files
async function traverseAndImport(dir, collectionName) {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = lstatSync(filePath);

    if (stat.isDirectory()) {
      // If it's a directory, recursively traverse it
      await traverseAndImport(filePath, collectionName);
    } else if (extname(file) === ".json") {
      // If it's a JSON file, read and import it
      const jsonData = readFileSync(filePath, "utf-8");
      const parsedData = JSON.parse(jsonData);
      await importToMongoDB(parsedData, collectionName);
      console.log(`Imported: ${filePath} into collection: ${collectionName}`);
    }
  }
}

// Function to import data into MongoDB
async function importToMongoDB(data, collectionName) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    await collection.insertMany(Array.isArray(data) ? data : [data]);
  } catch (error) {
    console.error("Error importing data to MongoDB:", error);
  } finally {
    await client.close();
  }
}

// Specify the directories to start traversing and corresponding collection names
const startDirs = [
  {
    dir: "/Users/hisham/Documents/Major Project/sus-openehr-builder/output/bariatrics/json/composition",
    collection: "bariatrics",
  },
  {
    dir: "/Users/hisham/Documents/Major Project/sus-openehr-builder/output/chemotherapy/json/composition",
    collection: "chemotherapy",
  },
  {
    dir: "/Users/hisham/Documents/Major Project/sus-openehr-builder/output/radiotherapy/json/composition",
    collection: "radiotherapy",
  },
  {
    dir: "/Users/hisham/Documents/Major Project/sus-openehr-builder/output/nephrology/json/composition",
    collection: "nephrology",
  },
];

// Start the traversal and import process for each department
for (const { dir, collection } of startDirs) {
  traverseAndImport(dir, collection)
    .then(() =>
      console.log(
        `All JSON files imported successfully into collection: ${collection}`
      )
    )
    .catch((err) => console.error("Error during traversal:", err));
}
