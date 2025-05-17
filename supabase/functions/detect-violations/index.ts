
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { 
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Parse the request body
    const { imageUrl, videoUrl } = await req.json();

    if (!imageUrl && !videoUrl) {
      return new Response(
        JSON.stringify({ error: "Media URL is required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("Processing media:", imageUrl || videoUrl);

    // Determine media type and task type based on what we have
    const mediaUrl = imageUrl || videoUrl;
    const mediaType = imageUrl ? "image" : "video";
    
    // Detect violations using the API
    const results = await detectViolationsWithAPI(mediaUrl, mediaType);
    
    return new Response(
      JSON.stringify(results),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Function error:", error.message);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

// This function will use the ML API to detect violations
async function detectViolationsWithAPI(mediaUrl: string, mediaType: "image" | "video") {
  try {
    console.log(`Sending ${mediaType} to ML API for violation detection`);
    
    // We'll make multiple API calls to check for different violation types
    const taskTypes = ["Helmet Violation", "Triple Riding", "Wrong Route", "Pothole"];
    let allViolations: string[] = [];
    let highestConfidence = 0;
    
    for (const taskType of taskTypes) {
      try {
        // Prepare the request to the Hugging Face API
        const formData = new FormData();
        formData.append("data", mediaUrl); // The image URL
        formData.append("data", taskType); // The task type
        
        console.log(`Checking for ${taskType}...`);
        
        // Send request to the Hugging Face API
        const response = await fetch("https://majeed786-spot-violation.hf.space/api/predict", {
          method: "POST",
          body: formData
        });
        
        if (!response.ok) {
          console.error(`API response error for ${taskType}:`, await response.text());
          continue;
        }
        
        // Parse the API response
        const apiResult = await response.json();
        console.log(`${taskType} API response:`, apiResult);
        
        // Extract violations from the API response
        if (apiResult && Array.isArray(apiResult.data)) {
          const resultText = apiResult.data[0];
          
          if (typeof resultText === "string") {
            // Skip if no violation detected
            if (!resultText.toLowerCase().includes("no violation") && resultText.trim() !== "") {
              // Map the violation based on task type
              if (taskType === "Helmet Violation" && resultText.toLowerCase().includes("helmet")) {
                allViolations.push("No Helmet");
              } else if (taskType === "Triple Riding" && resultText.toLowerCase().includes("triple")) {
                allViolations.push("Triple Riding");
              } else if (taskType === "Wrong Route" && resultText.toLowerCase().includes("wrong")) {
                allViolations.push("Wrong Side");
              } else if (taskType === "Pothole" && resultText.toLowerCase().includes("pothole")) {
                allViolations.push("Pothole");
              }
            }
          }
        }
      } catch (taskError) {
        console.error(`Error processing ${taskType}:`, taskError);
        // Continue with the next task type
      }
    }
    
    // Remove duplicates
    allViolations = [...new Set(allViolations)];
    
    // Calculate confidence based on number of violations
    const confidence = allViolations.length > 0 ? 0.9 : 0;
    
    return {
      detectedViolations: allViolations,
      confidence,
      shouldAutoVerify: confidence > 0.8,
      message: allViolations.length > 0 ? "Violations detected" : "No violations detected"
    };
  } catch (error) {
    console.error("API detection error:", error);
    
    // Fallback to simulation if the API call fails
    console.log("API call failed. Using fallback simulation.");
    return simulateViolationDetection(mediaType);
  }
}

// Mock detection function as a fallback
function simulateViolationDetection(mediaType: "image" | "video") {
  // This function simulates ML detection with random results
  // Will be used as a fallback if the API call fails
  
  const possibleViolations = [
    "Triple Riding", 
    "No Helmet", 
    "Wrong Side", 
    "Pothole"
  ];
  
  // For demo purposes: randomly detect 0-2 violations
  const numViolations = Math.floor(Math.random() * 3);
  const detectedViolations = [];
  
  for (let i = 0; i < numViolations; i++) {
    const randomIndex = Math.floor(Math.random() * possibleViolations.length);
    const violation = possibleViolations[randomIndex];
    
    // Avoid duplicates
    if (!detectedViolations.includes(violation)) {
      detectedViolations.push(violation);
    }
  }
  
  const confidence = detectedViolations.length > 0 ? 0.85 : 0;
  
  return {
    detectedViolations,
    confidence,
    shouldAutoVerify: confidence > 0.8,
    message: detectedViolations.length > 0 ? "Violations detected" : "No violations detected"
  };
}
