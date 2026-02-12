const { Pool } = require('pg');
require('dotenv').config();

async function importStoneData() {
  console.log("Importing full stone data into database...");
  
  // Create database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log("Connected to database successfully");
    client.release();
    
    // Read and parse the main metadata file
    const fs = require('fs');
    const path = require('path');
    const metadataPath = path.join(__dirname, "fine_tuning_data", "metadata.jsonl");
    const metadataContent = fs.readFileSync(metadataPath, "utf-8");
    const metadataLines = metadataContent.trim().split("\n");
    
    console.log(`Processing ${metadataLines.length} entries from metadata.jsonl...`);
    
    let processedCount = 0;
    let errorCount = 0;
    
    for (const line of metadataLines) {
      if (!line.trim()) continue;
      
      try {
        const stoneData = JSON.parse(line);
        
        // Validate required fields
        if (!stoneData.text) {
          errorCount++;
          continue;
        }
        
        // Extract product information
        const name = stoneData.additional_data?.fullTitle || 
                    stoneData.additional_data?.smallName || 
                    stoneData.text.substring(0, 50) || 
                    "Unknown Stone";
        
        // Clean up the name to remove special characters
        const cleanName = name.replace(/[™®]/g, '').trim();
        
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
        const descriptionParts = [];
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
        
        const description = descriptionParts.join(". ").substring(0, 500); // Limit description length
        
        // Determine if this should be featured
        const isFeatured = Math.random() > 0.85; // ~15% marked as featured
        
        // Use the imageUrl from the data or fallback to a placeholder
        const imageUrl = stoneData.additional_data?.imageUrl || 
                        "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&q=80&w=1280";
        
        // Insert the product into the database
        const insertQuery = `
          INSERT INTO products (name, category, description, image_url, is_featured)
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        await pool.query(insertQuery, [
          cleanName,
          category,
          description,
          imageUrl,
          isFeatured
        ]);
        
        processedCount++;
        
        if (processedCount % 50 === 0) {
          console.log(`Processed ${processedCount} entries...`);
        }
      } catch (parseError) {
        errorCount++;
        if (errorCount < 10) { // Only show first 10 errors
          console.warn(`Skipping invalid JSON line:`, line.substring(0, 100));
        }
        continue;
      }
    }
    
    console.log(`Successfully imported ${processedCount} stone products from metadata.jsonl`);
    if (errorCount > 0) {
      console.log(`Skipped ${errorCount} entries due to parsing errors`);
    }
    
    // Now let's try to import some Caesarstone data if available
    try {
      const caesarstonePath = path.join(__dirname, "fine_tuning_data", "caesarstone_data.jsonl");
      if (fs.existsSync(caesarstonePath)) {
        const caesarstoneContent = fs.readFileSync(caesarstonePath, "utf-8");
        const caesarstoneLines = caesarstoneContent.trim().split("\n");
        
        console.log(`Processing ${caesarstoneLines.length} entries from caesarstone_data.jsonl...`);
        
        let caesarstoneCount = 0;
        for (const line of caesarstoneLines) {
          if (!line.trim()) continue;
          
          try {
            const stoneData = JSON.parse(line);
            
            if (!stoneData.text) continue;
            
            const name = stoneData.additional_data?.fullTitle || 
                        stoneData.additional_data?.smallName || 
                        "Unknown Caesarstone";
            
            const cleanName = name.replace(/[™®]/g, '').trim();
            let category = "Caesarstone";
            
            if (stoneData.additional_data?.categories) {
              const stoneCategories = stoneData.additional_data.categories.filter(cat => 
                ["Marble", "Granite", "Quartz", "Quartzite", "Limestone", "Travertine", "Onyx", "Slate"].includes(cat)
              );
              if (stoneCategories.length > 0) {
                category = stoneCategories[0];
              }
            }
            
            const description = stoneData.text.substring(0, 500);
            const isFeatured = Math.random() > 0.9; // 10% featured
            const imageUrl = stoneData.additional_data?.imageUrl || 
                            "https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&q=80&w=1280";
            
            await pool.query(insertQuery, [
              cleanName,
              category,
              description,
              imageUrl,
              isFeatured
            ]);
            
            caesarstoneCount++;
            processedCount++;
            
          } catch (error) {
            continue;
          }
        }
        
        console.log(`Successfully imported ${caesarstoneCount} Caesarstone products`);
      }
    } catch (error) {
      console.log("Caesarstone data not available or error processing it");
    }
    
    console.log(`\n🎉 Successfully imported ${processedCount} total stone products into the database!`);
    console.log("The AI now has access to the complete stone catalog for visualizations.");
    
    // Test that we can read the data back
    const result = await pool.query('SELECT COUNT(*) FROM products');
    console.log(`Total products in database: ${result.rows[0].count}`);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("Error importing stone data:", error);
    await pool.end();
    process.exit(1);
  }
}

importStoneData();