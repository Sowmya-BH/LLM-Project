const GROQ_API_KEY = process.env.groq_api_key; // To fetch environment variable from .env
// Configuration
//const GROQ_API_KEY =""//process.env.groq_api_key; // Replace with your actual key or use environment variable
const MODEL_NAME = "gemma2-9b-it"; // 
const MAX_TOKENS = 1000;
const TEMPERATURE = 0.7;

// Chat history
let chatHistory = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM content fully loaded."); // Log when DOM is ready

    const promptForm = document.getElementById('promptForm');
    const promptInput = document.getElementById('promptInput');
    // const contextFileInput = document.getElementById('contextFile'); // This element is not in your HTML
    const submitBtn = document.getElementById('submitBtn');
    const responseContainer = document.getElementById('responseContainer');

    // Add a check to ensure elements are found
    if (!promptForm || !promptInput || !submitBtn || !responseContainer) {
        console.error("One or more required HTML elements not found!");
        return;
    }
    
    promptForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log("Form submitted."); // Log form submission
        
        const prompt = promptInput.value.trim();
        if (!prompt) {
            console.log("Prompt is empty. Aborting."); // Log if prompt is empty
            return;
        }
        
        // Clear previous response and show loading
        responseContainer.innerHTML = '<p class="loading">Generating response...</p>';
        submitBtn.disabled = true;
        
        try {
            let fullPrompt = prompt;
            
        
            console.log("User prompt:", fullPrompt); // Log the full prompt being sent

            // Add user message to history
            chatHistory.push({ role: "user", content: fullPrompt });
            console.log("Chat history after user message:", chatHistory); // Log updated chat history
            
            // Keep only last 5 messages for context
            const recentHistory = chatHistory.slice(-5);
            console.log("Recent history sent to API:", recentHistory); // Log recent history

            // Check for API key before fetching
            if (!GROQ_API_KEY || GROQ_API_KEY === 'undefined' || GROQ_API_KEY === 'null') {
                throw new Error("GROQ_API_KEY is not set. Please check your environment variables or configuration.");
            }
            
            const response = await fetchGroqResponse([
                { 
                    role: "system", 
                    content: "You are a coding copilot. Provide accurate code snippets, explanations, and debugging help. Format code in markdown code blocks with proper syntax highlighting." 
                },
                ...recentHistory
            ]);
            
            console.log("Groq API response received (raw):", response); // Log raw API response
            
            // Add assistant response to history
            chatHistory.push({ role: "assistant", content: response });
            console.log("Chat history after assistant message:", chatHistory); // Log updated chat history
            
            // Display formatted response
            responseContainer.innerHTML = `<div class="response">${formatResponse(response)}</div>`;
            console.log("Response displayed in container."); // Log display action
            
        } catch (err) {
            console.error('Error during API call or processing:', err); // Log any errors
            responseContainer.innerHTML = `<div class="error">❌ Error: ${err.message}</div>`;
        } finally {
            submitBtn.disabled = false;
            console.log("Submit button re-enabled."); // Log button re-enable
        }
    });
});

async function fetchGroqResponse(messages) {
    console.log("Attempting to fetch response from Groq API..."); // Log API call initiation
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: messages,
                max_tokens: MAX_TOKENS,
                temperature: TEMPERATURE
            })
        });
        
        console.log("Groq API fetch response status:", response.status, response.statusText); // Log HTTP status
        
        if (!response.ok) {
            const errorBody = await response.text(); // Get error body for more info
            console.error("Groq API non-OK response body:", errorBody); // Log error body
            throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
        }
        
        const data = await response.json();
        console.log("Groq API raw data:", data); // Log the full JSON data from API
        return data.choices[0].message.content;
    } catch (err) {
        console.error("Groq API error in fetchGroqResponse:", err); // Log specific errors during fetch
        throw err; // Re-throw to be caught by the main try-catch block
    }
}

// This function is not used in HTML
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    });
}

function formatResponse(text) {
    console.log("Formatting response text."); // Log formatting initiation
    // Convert markdown code blocks to HTML
    const formatted = text.replace(/```(\w*)([\s\S]*?)```/g, (match, language, code) => {
        return `<pre><code class="language-${language || 'text'}">${code.trim()}</code></pre>`;
    });
    console.log("Formatted text (partial view):", formatted.substring(0, 200) + "..."); // Log a snippet of formatted text
    return formatted;
}
