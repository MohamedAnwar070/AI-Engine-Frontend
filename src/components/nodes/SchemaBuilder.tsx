import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Box } from "lucide-react";

export interface SchemaField {
  name: string;
  type: string;
}

interface SchemaBuilderProps {
  title?: string;
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
}

const FIELD_TYPES = ["string", "number", "boolean", "array", "object"];

export function SchemaBuilder({ title, fields, onChange }: SchemaBuilderProps) {

  const addField = () => {
    const newFields = [...fields, { name: "", type: "string" }];
    onChange(newFields);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onChange(newFields);
  };

  const updateField = (index: number, key: keyof SchemaField, value: string) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    onChange(newFields);
  };

  const validFieldsCount = fields.filter(f => f.name && f.name.trim()).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        {title && (
          <div>
            <h3 className="text-lg font-display font-bold text-foreground">{title}</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
              {validFieldsCount} VALID PARAMETER{validFieldsCount !== 1 ? 'S' : ''}
            </p>
          </div>
        )}
        <Button onClick={addField} size="sm" variant="outline" type="button" className="rounded-[6px] ghost-border h-9 font-bold text-xs uppercase tracking-tight hover:bg-primary hover:text-black transition-all">
          <Plus className="h-4 w-4 mr-2" />
          Add Parameter
        </Button>
      </div>

      <div className="space-y-4">
        {fields.length === 0 ? (
          <div className="text-center py-12 rounded-[12px] bg-surface-lowest/50 ghost-border border-transparent">
             <div className="flex justify-center mb-4">
                <Box className="h-8 w-8 text-muted-foreground/30" />
             </div>
             <p className="text-sm font-sans font-medium text-muted-foreground">
               No parameters defined for this node.
             </p>
          </div>
        ) : (
          fields.map((field, index) => (
            <div key={index} className="flex gap-4 items-end animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex-[2] space-y-2">
                <Label htmlFor={`field-name-${index}-${title}`} className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Key</Label>
                <Input
                  id={`field-name-${index}-${title}`}
                  value={field.name}
                  onChange={(e) => updateField(index, "name", e.target.value)}
                  placeholder="e.g. user_id"
                  className="bg-surface-lowest ghost-border border-transparent h-10 rounded-[6px] font-mono text-xs"
                />
              </div>

              <div className="flex-1 space-y-2">
                <Label htmlFor={`field-type-${index}-${title}`} className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Type</Label>
                <Select
                  value={field.type}
                  onValueChange={(value) => updateField(index, "type", value)}
                >
                  <SelectTrigger id={`field-type-${index}-${title}`} className="bg-surface-lowest border-transparent rounded-[6px] h-10 font-sans text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-high border-none rounded-[8px] ghost-border">
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="text-xs font-sans font-medium focus:bg-primary/10">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => removeField(index)}
                size="icon"
                variant="ghost"
                type="button"
                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[6px]"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {fields.length > 0 && (
        <div className="mt-6 p-5 bg-black/40 rounded-[8px] ghost-border border-transparent relative group">
          <div className="absolute top-3 right-3 text-[9px] font-bold text-muted-foreground tracking-widest opacity-40 uppercase">JSON_SCHEMA_PREVIEW</div>
          <p className="text-[10px] font-bold text-primary mb-3 uppercase tracking-widest font-sans">Schema Mapping:</p>
          <pre className="text-[11px] font-mono text-emerald-400/80 leading-relaxed overflow-x-auto custom-scrollbar">
            {JSON.stringify(
              fields.reduce((acc, f) => {
                if (f.name && f.name.trim()) acc[f.name] = f.type;
                return acc;
              }, {} as Record<string, string>),
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
