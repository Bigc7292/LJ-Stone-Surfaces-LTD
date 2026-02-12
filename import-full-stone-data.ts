import { db } from "./server/db";
import { products } from "./shared/schema";
import * as fs from "fs/promises";
import { join } from "path";

// Use dynamic import to get the directory path
const __dirname = "."; // For simplicity when running directly

interface StoneData {
  file_name?: string;
  text: string;
  additional_data?: {
    code?: string;
    smallName?: string;
    fullTitle?: string;
    finish?: string;
    brand?: string;
    dimensions?: string;
    imageUrl?: string;
    categories?: string[];
    rawTitle?: string;
  };
}

async function importFullStoneData() {
  console.log("Importing full stone data into database...");
  
  try {
    // Read and parse the main metadata file
    const metadataPath = join("fine_tuning_data", "metadata.jsonl");
    const metadataContent = await fs.readFile(metadataPath, "utf-8");
    const metadataLines = metadataContent.trim().split("\n");
    
    console.log(`Processing ${metadataLines.length} entries from metadata.jsonl...`);
    
    let processedCount = 0;
    
    for (const line of metadataLines) {
      if (!line.trim()) continue;
      
      try {
        const stoneData: StoneData = JSON.parse(line);
        
        // Extract product information
        const name = stoneData.additional_data?.fullTitle || 
                    stoneData.additional_data?.smallName || 
                    stoneData.text.substring(0, 50) || 
                    "Unknown Stone";
        
        // Determine category from available data
        let category = "Stone";
        if (stoneData.additional_data?.categories) {
          const stoneCategories = stoneData.additional_data.categories.filter(cat => 
            ["Marble", "Granite", "Quartz", "Quartzite", "Limestone", "Travertine", "Onyx", "Slate"].includes(cat)
          );
          if (stoneCategories.length > 0) {
            category = stoneCategories[0];
          }
        }
        
        // Construct description
        const descriptionParts: string[] = [];
        if (stoneData.additional_data?.brand) {
          descriptionParts.push(stoneData.additional_data.brand);
        }
        if (stoneData.additional_data?.finish) {
          descriptionParts.push(`${stoneData.additional_data.finish} finish`);
        }
        if (stoneData.additional_data?.dimensions) {
          descriptionParts.push(`Dimensions: ${stoneData.additional_data.dimensions}`);
        }
        if (stoneData.text) {
          descriptionParts.push(stoneData.text);
        }
        
        const description = descriptionParts.join(". ");
        
        // Determine if this should be featured (perhaps based on some criteria)
        const isFeatured = Math.random() > 0.7; // Randomly mark ~30% as featured
        
        // Use the imageUrl from the data or fallback to a placeholder
        const imageUrl = stoneData.additional_data?.imageUrl || 
                        "/attached_assets/placeholder-stone.jpg";
        
        // Insert the product into the database
        const productValues = {
          name: name as string,
          category: category as string,
          description: description as string,
          imageUrl: imageUrl as string,
          isFeatured: isFeatured as boolean
        };
        await db.insert(products).values(productValues);
        
        processedCount++;
        
        if (processedCount % 50 === 0) {
          console.log(`Processed ${processedCount}/${metadataLines.length} entries...`);
        }
      } catch (parseError) {
        console.warn(`Skipping invalid JSON line:`, line.substring(0, 100));
        continue;
      }
    }
    
    console.log(`Successfully imported ${processedCount} stone products from metadata.jsonl`);
    
    // Now process Caesarstone data
    const caesarstonePath = join("fine_tuning_data", "caesarstone_data.jsonl");
    try {
      const caesarstoneContent = await fs.readFile(caesarstonePath, "utf-8");
      const caesarstoneLines = caesarstoneContent.trim().split("\n");
      
      console.log(`Processing ${caesarstoneLines.length} entries from caesarstone_data.jsonl...`);
      
      for (const line of caesarstoneLines) {
        if (!line.trim()) continue;
        
        try {
          const stoneData: StoneData = JSON.parse(line);
          
          // Extract product information
          const name = stoneData.additional_data?.fullTitle || 
                      stoneData.additional_data?.smallName || 
                      stoneData.text.substring(0, 50) || 
                      "Unknown Caesarstone";
          
          let category = "Caesarstone";
          if (stoneData.additional_data?.categories) {
            const stoneCategories = stoneData.additional_data.categories.filter(cat => 
              ["Marble", "Granite", "Quartz", "Quartzite", "Limestone", "Travertine", "Onyx", "Slate"].includes(cat)
            );
            if (stoneCategories.length > 0) {
              category = stoneCategories[0];
            }
          }
          
          const descriptionParts: string[] = [];
          if (stoneData.additional_data?.brand) {
            descriptionParts.push(stoneData.additional_data.brand);
          }
          if (stoneData.additional_data?.finish) {
            descriptionParts.push(`${stoneData.additional_data.finish} finish`);
          }
          if (stoneData.text) {
            descriptionParts.push(stoneData.text);
          }
          
          const description = descriptionParts.join(". ");
          const isFeatured = Math.random() > 0.7;
          const imageUrl = stoneData.additional_data?.imageUrl || 
                          "/attached_assets/placeholder-stone.jpg";
          
          const productValues = {
            name: name as string,
            category: category as string,
            description: description as string,
            imageUrl: imageUrl as string,
            isFeatured: isFeatured as boolean
          };
          await db.insert(products).values(productValues);
          
          processedCount++;
        } catch (parseError) {
          console.warn(`Skipping invalid Caesarstone JSON line:`, line.substring(0, 100));
          continue;
        }
      }
      
      console.log(`Successfully imported Caesarstone products`);
    } catch (error) {
      console.warn("Could not read Caesarstone data file, skipping...", error.message);
    }
    
    // Process Gemini training data
    const geminiPath = join("data_science", "gemini_training_data.jsonl");
    try {
      const geminiContent = await fs.readFile(geminiPath, "utf-8");
      const geminiLines = geminiContent.trim().split("\n");
      
      console.log(`Processing ${geminiLines.length} entries from gemini_training_data.jsonl...`);
      
      for (const line of geminiLines) {
        if (!line.trim()) continue;
        
        try {
          const stoneData: StoneData = JSON.parse(line);
          
          // Extract product information
          const name = stoneData.additional_data?.fullTitle || 
                      stoneData.additional_data?.smallName || 
                      stoneData.text?.substring(0, 50) || 
                      `Gemini Stone ${processedCount}`;
          
          let category = "Gemini Stone";
          if (stoneData.additional_data?.categories) {
            const stoneCategories = stoneData.additional_data.categories.filter(cat => 
              ["Marble", "Granite", "Quartz", "Quartzite", "Limestone", "Travertine", "Onyx", "Slate"].includes(cat)
            );
            if (stoneCategories.length > 0) {
              category = stoneCategories[0];
            }
          }
          
          const description = stoneData.text || "Advanced AI-trained stone sample";
          const isFeatured = Math.random() > 0.8; // 20% marked as featured
          const imageUrl = stoneData.additional_data?.imageUrl || 
                          "/attached_assets/placeholder-stone.jpg";
          
          const productValues = {
            name: name as string,
            category: category as string,
            description: description as string,
            imageUrl: imageUrl as string,
            isFeatured: isFeatured as boolean
          };
          await db.insert(products).values(productValues);
          
          processedCount++;
          
          if (processedCount % 100 === 0) {
            console.log(`Processed ${processedCount} total entries...`);
          }
        } catch (parseError) {
          console.warn(`Skipping invalid Gemini JSON line:`, line.substring(0, 100));
          continue;
        }
      }
      
      console.log(`Successfully imported Gemini training data products`);
    } catch (error) {
      console.warn("Could not read Gemini training data file, skipping...", error.message);
    }
    
    console.log(`\n🎉 Successfully imported ${processedCount} total stone products into the database!`);
    console.log("The AI now has access to the complete stone catalog for visualizations.");
    
    process.exit(0);
  } catch (error) {
    console.error("Error importing stone data:", error);
    process.exit(1);
  }
}

importFullStoneData();