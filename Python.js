

// --- Python JS Object Implementation ---
const Python = {
    workerId: null, // Stores the current worker ID
    outputListeners: [], // For real-time output updates (not fully implemented in this demo)

    async Register() {
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (response.ok) {
                this.workerId = data.worker_id;
                console.log('Worker Registered:', this.workerId);
                return this.workerId;
            } else {
                console.error('Failed to register worker:', data.error);
                throw new Error(data.error || 'Unknown error during registration');
            }
        } catch (error) {
            console.error('Network or API error during registration:', error);
            throw error;
        }
    },

    async Run(code, workerId = this.workerId) {
        if (!workerId) {
            throw new Error("No worker ID provided. Please register a worker first.");
        }
        try {
            const response = await fetch(`${API_BASE_URL}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, worker_id: workerId }),
            });
            const data = await response.json();
            if (response.ok) {
                console.log('Code Run Result:', data.output);
                return data.output; // Returns output of this specific run
            } else {
                console.error('Failed to run code:', data.error, data.output);
                throw new Error(data.output || data.error || 'Unknown error during code execution');
            }
        } catch (error) {
            console.error('Network or API error during code execution:', error);
            throw error;
        }
    },

    async Output(workerId = this.workerId) {
        if (!workerId) {
            throw new Error("No worker ID provided. Please register a worker first.");
        }
        try {
            const response = await fetch(`${API_BASE_URL}/output/${workerId}`);
            const data = await response.json();
            if (response.ok) {
                console.log('Full Worker Output:', data.output);
                return data.output;
            } else {
                console.error('Failed to get output:', data.error);
                throw new Error(data.error || 'Unknown error getting output');
            }
        } catch (error) {
            console.error('Network or API error getting output:', error);
            throw error;
        }
    },

    async OutputLastCode(workerId = this.workerId) {
        if (!workerId) {
            throw new Error("No worker ID provided. Please register a worker first.");
        }
        try {
            const response = await fetch(`${API_BASE_URL}/output_last_code/${workerId}`);
            const data = await response.json();
            if (response.ok) {
                console.log('Last Code Output:', data.output);
                return data.output;
            } else {
                console.error('Failed to get last code output:', data.error);
                throw new Error(data.error || 'Unknown error getting last code output');
            }
        } catch (error) {
            console.error('Network or API error getting last code output:', error);
            throw error;
        }
    },

    async Require(modulename, workerId = this.workerId) {
        if (!workerId) {
            throw new Error("No worker ID provided. Please register a worker first.");
        }
        try {
            const response = await fetch(`${API_BASE_URL}/require`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modulename, worker_id: workerId }),
            });
            const data = await response.json();
            if (response.ok) {
                console.log('Require Module Result:', data.message);
                return data.message;
            } else {
                console.error('Failed to require module:', data.error);
                throw new Error(data.error || 'Unknown error requiring module');
            }
        } catch (error) {
            console.error('Network or API error requiring module:', error);
            throw error;
        }
    },

    async Quit(workerId = this.workerId) {
        if (!workerId) {
            console.warn("No worker ID to quit.");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/quit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ worker_id: workerId }),
            });
            const data = await response.json();
            if (response.ok) {
                console.log('Worker Quit Result:', data.message);
                this.workerId = null; // Clear worker ID on successful quit
                return data.message;
            } else {
                console.error('Failed to quit worker:', data.error);
                throw new Error(data.error || 'Unknown error quitting worker');
            }
        } catch (error) {
            console.error('Network or API error quitting worker:', error);
            throw error;
        }
    },
    async SetBaseURL(url) { const API_BASE_URL = url }

    /**
     * Processes all <py> tags found in the HTML document.
     * Extracts Python code, corrects indentation, runs it, and replaces the tag content with output.
     */
    async ProcessHTML() {
        if (!this.workerId) {
            try {
                await this.Register();
                console.log("Worker registered automatically for <py> tag processing.");
                // Update UI if needed (e.g., workerIdDisplay)
                document.getElementById('workerIdDisplay').textContent = this.workerId;
            } catch (e) {
                console.error("Failed to register worker for <py> tags:", e);
                // Display error in a prominent place or relevant <py> tags
                document.querySelectorAll('py').forEach(pyTag => {
                    pyTag.innerHTML = `<span style="color: red;">Error: Could not register worker: ${e.message}</span>`;
                });
                return;
            }
        }

        const pyTags = document.querySelectorAll('py');
        for (const pyTag of pyTags) {
            const originalCode = pyTag.textContent;
            const cleanedCode = correctIndentation(originalCode);
            pyTag.innerHTML = `<span style="color: gray;">Executing Python code...</span>`; // Indicate processing

            try {
                const output = await this.Run(cleanedCode);
                // Ensure output is displayed cleanly, e.g., in a <pre> or styled div
                pyTag.innerHTML = `<pre style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; white-space: pre-wrap;">${output}</pre>`;
            } catch (error) {
                // Display error message directly in the <py> tag
                pyTag.innerHTML = `<span style="color: red; font-family: monospace;">Python Error in &lt;py&gt; tag:\n${error.message}</span>`;
                console.error("Error processing <py> tag:", error);
            }
        }
    }
};

// --- Dynamic Script Loading Function ---
/**
 * Dynamically loads a JavaScript file from a given URL.
 * @param {string} url The URL of the script to load.
 * @returns {Promise<Event>} A promise that resolves when the script is loaded, or rejects on error.
 */
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = (event) => {
            console.log(`Script loaded successfully: ${url}`);
            resolve(event);
        };
        script.onerror = (error) => {
            console.error(`Error loading script: ${url}`, error);
            reject(new Error(`Failed to load script: ${url}`));
        };
        document.head.appendChild(script);
    });
}

/**
 * Helper function to correct leading indentation from multi-line code strings.
 * This is crucial for Python code embedded in HTML to avoid IndentationError.
 * @param {string} code The Python code string.
 * @returns {string} The code string with common leading indentation removed.
 */
function correctIndentation(code) {
    const lines = code.split('\n');
    let minIndent = -1;

    // Find the minimum leading indentation of non-empty lines
    for (const line of lines) {
        if (line.trim().length === 0) continue; // Skip empty lines for indent calculation
        const leadingSpaces = line.match(/^\s*/)[0].length;
        if (minIndent === -1 || leadingSpaces < minIndent) {
            minIndent = leadingSpaces;
        }
    }

    if (minIndent === -1 || minIndent === 0) { // No common indent or only empty lines
        return code;
    }

    // Remove the minimum common indentation from all lines
    const correctedLines = lines.map(line => {
        if (line.trim().length === 0) return ''; // Keep truly empty lines as empty
        return line.substring(minIndent);
    });

    return correctedLines.join('\n');
}
