import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Code2, Lightbulb, HelpCircle } from "lucide-react";

export default function Documentation() {
  return (
    <PageContainer
      title="Documentation"
      description="Learn how to use the Perfect UI Engine platform"
    >
      <Tabs defaultValue="getting-started" className="space-y-8">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 h-auto p-1">
          <TabsTrigger value="getting-started" className="py-3">
            <BookOpen className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Getting Started</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="py-3">
            <Code2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">API Reference</span>
          </TabsTrigger>
          <TabsTrigger value="examples" className="py-3">
            <Lightbulb className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Examples</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="py-3">
            <HelpCircle className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">FAQ</span>
          </TabsTrigger>
        </TabsList>

        {/* Getting Started */}
        <TabsContent value="getting-started">
          <Card className="glass-card p-8 md:p-12 prose prose-invert max-w-none">
            <h2 className="text-3xl font-bold mb-6">Getting Started with Perfect UI Engine</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold mb-4">What is Perfect UI Engine?</h3>
                <p className="text-lg leading-relaxed">
                  Perfect UI Engine is a multi-tenant bot builder platform that allows you to create
                  intelligent chatbots with node-based API integrations. Think of it as Flowise AI
                  meets n8n meets Botpress.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4">Quick Start Guide</h3>
                <ol className="space-y-4 text-base list-decimal list-inside">
                  <li className="leading-relaxed">
                    <strong>Create a Project:</strong> Click "Create Project" and fill in your bot's
                    name, description, and system prompt.
                  </li>
                  <li className="leading-relaxed">
                    <strong>Add Nodes:</strong> Navigate to your project and add API integration nodes.
                    Each node can call external APIs.
                  </li>
                  <li className="leading-relaxed">
                    <strong>Test Your Bot:</strong> Use the Test Chat tab to interact with your bot
                    and see the nodes in action.
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4">Key Concepts</h3>
                <ul className="space-y-3 text-base">
                  <li className="leading-relaxed">
                    <strong>Projects:</strong> Each project represents a bot with its own personality
                    and configuration.
                  </li>
                  <li className="leading-relaxed">
                    <strong>Nodes:</strong> API integrations that your bot can use to fetch data or
                    perform actions.
                  </li>
                  <li className="leading-relaxed">
                    <strong>Root Node:</strong> The primary node that gets called first (optional).
                  </li>
                  <li className="leading-relaxed">
                    <strong>Schema:</strong> Defines the inputs and outputs for each node.
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* API Reference */}
        <TabsContent value="api">
          <Card className="glass-card p-8 md:p-12 prose prose-invert max-w-none">
            <h2 className="text-3xl font-bold mb-6">API Reference</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold mb-4">Backend Endpoints</h3>
                <p className="text-base mb-4">Base URL: <code className="bg-primary/20 px-2 py-1 rounded">http://localhost:8000</code></p>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3">Projects</h4>
                <ul className="space-y-2 text-base">
                  <li><code className="bg-black/30 px-2 py-1 rounded">POST /api/projects</code> - Create new project</li>
                  <li><code className="bg-black/30 px-2 py-1 rounded">GET /api/projects</code> - List all projects</li>
                  <li><code className="bg-black/30 px-2 py-1 rounded">GET /api/projects/:id</code> - Get single project</li>
                  <li><code className="bg-black/30 px-2 py-1 rounded">PUT /api/projects/:id</code> - Update project</li>
                  <li><code className="bg-black/30 px-2 py-1 rounded">DELETE /api/projects/:id</code> - Delete project</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3">Nodes</h4>
                <ul className="space-y-2 text-base">
                  <li><code className="bg-black/30 px-2 py-1 rounded">POST /api/nodes</code> - Create new node</li>
                  <li><code className="bg-black/30 px-2 py-1 rounded">GET /api/projects/:id/nodes</code> - List nodes for project</li>
                  <li><code className="bg-black/30 px-2 py-1 rounded">GET /api/nodes/:id</code> - Get single node</li>
                  <li><code className="bg-black/30 px-2 py-1 rounded">PUT /api/nodes/:id</code> - Update node</li>
                  <li><code className="bg-black/30 px-2 py-1 rounded">DELETE /api/nodes/:id</code> - Delete node</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xl font-semibold mb-3">Execution</h4>
                <ul className="space-y-2 text-base">
                  <li><code className="bg-black/30 px-2 py-1 rounded">POST /api/execute-node</code> - Execute node directly</li>
                  <li><code className="bg-black/30 px-2 py-1 rounded">POST /api/chat</code> - Chat with bot</li>
                  <li><code className="bg-black/30 px-2 py-1 rounded">GET /api/conversations/:id</code> - Get conversation history</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Examples */}
        <TabsContent value="examples">
          <Card className="glass-card p-8 md:p-12 prose prose-invert max-w-none">
            <h2 className="text-3xl font-bold mb-6">Example Projects</h2>

            <div className="space-y-10">
              <div>
                <h3 className="text-2xl font-semibold mb-4">Job Portal Bot</h3>
                <p className="text-base mb-4">A bot that helps users search for jobs:</p>
                <pre className="bg-black/30 p-6 rounded-lg text-sm leading-relaxed overflow-x-auto">{`{
  "name": "JobPortal Bot",
  "description": "A bot for job searching",
  "llm_prompt": "You are a helpful job search assistant..."
}`}</pre>

                <h4 className="text-xl font-semibold mb-3 mt-6">Example Node: SearchJobs</h4>
                <pre className="bg-black/30 p-6 rounded-lg text-sm leading-relaxed overflow-x-auto">{`{
  "name": "SearchJobs",
  "description": "Search for jobs by location and role",
  "node_schema": {
    "inputs": {
      "location": "string",
      "role": "string"
    },
    "outputs": {
      "jobs": "array",
      "total_count": "number"
    }
  }
}`}</pre>
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4">Weather Bot</h3>
                <p className="text-base mb-4">A bot that provides weather information:</p>
                <pre className="bg-black/30 p-6 rounded-lg text-sm leading-relaxed overflow-x-auto">{`async function executeNode(inputs) {
  const response = await fetch(
    \`https://api.openweathermap.org/data/2.5/weather?q=\${inputs.city}&appid=YOUR_KEY\`
  );
  
  const data = await response.json();
  
  return {
    temperature: data.main.temp,
    description: data.weather[0].description,
    humidity: data.main.humidity
  };
}`}</pre>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq">
          <Card className="glass-card p-8 md:p-12 prose prose-invert max-w-none">
            <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-3">What is a Root Node?</h3>
                <p className="text-base leading-relaxed">
                  A root node is the primary entry point for your bot. It's the first node that gets
                  executed when a conversation starts. You can only have one root node per project.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">How do I test my nodes?</h3>
                <p className="text-base leading-relaxed">
                  You can test individual nodes by clicking the "Test" button on the node card, or
                  test your entire bot using the Test Chat interface in the project detail page.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">What packages are available in node code?</h3>
                <p className="text-base leading-relaxed">
                  You have access to standard JavaScript APIs including fetch, and popular packages
                  like axios and node-fetch for making HTTP requests.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Can I use external APIs?</h3>
                <p className="text-base leading-relaxed">
                  Yes! Nodes are designed to integrate with external APIs. Just make sure to handle
                  errors properly and return the expected output schema.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">How does the LLM use my nodes?</h3>
                <p className="text-base leading-relaxed">
                  The LLM automatically determines which nodes to call based on the user's message
                  and the node descriptions. Make sure your node descriptions clearly explain when
                  to use each node.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
