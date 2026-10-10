import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Loader2, Bug, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SchemaField } from "./SchemaBuilder";

interface NodeTestDialogProps {
    isOpen: boolean;
    onClose: () => void;
    schema: SchemaField[];
    toolCode: string;
    projectId: string;
    nodeName: string;
}

export function NodeTestDialog({ isOpen, onClose, schema, toolCode, projectId, nodeName }: NodeTestDialogProps) {
    const [inputs, setInputs] = useState<Record<string, string>>({});
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleRun = async () => {
        setIsLoading(true);
        setResult(null);
        try {
            const response = await api.executeNode(projectId, nodeName, inputs, toolCode);
            setResult(response);
            toast.success("Execution completed");
        } catch (error) {
            setResult({ error: error instanceof Error ? error.message : "Creating execution failed" });
            toast.error("Execution failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-black/80 backdrop-blur-xl border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Play className="h-5 w-5 text-primary" />
                        Test Execution
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4 lg:grid-cols-2">
                    {/* Inputs Column */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Inputs</h3>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-4">
                                {schema.length === 0 && (
                                    <p className="text-sm text-muted-foreground italic">No inputs defined in schema.</p>
                                )}
                                {schema.map((field) => (
                                    <div key={field.name} className="space-y-2">
                                        <Label className="text-xs font-mono text-primary/80">
                                            ${field.name} <span className="text-muted-foreground opacity-50">({field.type})</span>
                                        </Label>
                                        <Input
                                            placeholder={`Enter value for ${field.name}...`}
                                            className="bg-white/5 border-white/10 focus:ring-primary/40 font-mono text-xs"
                                            value={inputs[field.name] || ""}
                                            onChange={(e) => setInputs({ ...inputs, [field.name]: e.target.value })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Results Column */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Result</h3>
                        <div className="h-[300px] rounded-xl bg-black/50 border border-white/10 p-4 font-mono text-xs overflow-auto relative group">
                            {isLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20 backdrop-blur-sm z-10">
                                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                    <span className="text-primary font-bold animate-pulse">RUNNING...</span>
                                </div>
                            ) : result ? (
                                <pre className={`whitespace-pre-wrap ${result.success === false || result.error ? 'text-red-400' : 'text-green-400'}`}>
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                    <Bug className="h-8 w-8 mb-2" />
                                    <p>Ready to execute</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={onClose} className="hover:bg-white/10">Close</Button>
                    <Button onClick={handleRun} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-black font-bold">
                        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                        Run Test
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
