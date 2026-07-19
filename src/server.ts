import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));

/**
 * Smart AI Filter Endpoint
 * Uses Gemini to semantically filter row data based on natural language query
 */
app.post('/api/filter/smart-ai', async (req, res) => {
  try {
    const { query, rows } = req.body;
    if (!query || !rows || !Array.isArray(rows)) {
       res.status(400).json({ error: 'Missing query or rows' });
       return;
    }

    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
       // Graceful fallback if API key is not present: filter client-side with basic matching
       console.warn('No GEMINI_API_KEY found, falling back to mock response');
       const fallbackIds = rows
         .filter(row => {
           const str = JSON.stringify(row).toLowerCase();
           return str.includes(query.toLowerCase());
         })
         .map(row => row.id);
       res.json({ matchingIds: fallbackIds, isFallback: true });
       return;
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `You are a precise database filtering assistant.
Your task is to filter the given JSON array of records based on the user's natural language search query.
Evaluate the query against each record's fields (e.g. name, role, department, salary, age, location, status).
Be intelligent and flexible with matching:
- Handle numerical comparisons (e.g. "salary > 80000", "age under 30")
- Handle relative filters (e.g. "recent employees", "senior staff")
- Handle synonyms (e.g. "dev" or "coder" matches "Developer" or "Software Engineer")
- Handle location queries (e.g. "UK" matches "London" or "United Kingdom")
- Handle status values (e.g. "active" matches status "Active")

Return a JSON object containing a single property "matchingIds", which is an array of strings representing the "id" fields of all records that pass the filter.
Format:
{
  "matchingIds": ["id1", "id2", ...]
}
Do NOT include any markdown block, any backticks, or any conversational text. Return ONLY the raw JSON.`;

    const prompt = `User search query: "${query}"
Dataset of records:
${JSON.stringify(rows.map(r => ({ id: r.id, ...r.data })), null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });

    const resultText = response.text || '';
    try {
      const parsed = JSON.parse(resultText.trim());
      res.json({
        matchingIds: parsed.matchingIds || [],
        isFallback: false
      });
    } catch (parseError) {
      console.error('Error parsing Gemini response:', resultText, parseError);
      // Fallback in case of parse failure
      const fallbackIds = rows
        .filter(row => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()))
        .map(row => row.id);
      res.json({ matchingIds: fallbackIds, error: 'Failed to parse AI output', isFallback: true });
    }

  } catch (err: unknown) {
    console.error('Error in smart-ai filter endpoint:', err);
    const errMsg = err instanceof Error ? err.message : 'Internal Server Error';
    res.status(500).json({ error: errMsg });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
