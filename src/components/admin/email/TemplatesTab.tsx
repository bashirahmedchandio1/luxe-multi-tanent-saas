"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Send, FileText } from "lucide-react";
import { EMAIL_TEMPLATES, type EmailTemplate } from "@/lib/email-templates";

interface TemplatesTabProps {
  onUseInCompose?: (subject: string, html: string, templateKey: string) => void;
}

export default function TemplatesTab({ onUseInCompose }: TemplatesTabProps) {
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [previewHtml, setPreviewHtml] = useState("");

  const openPreview = (template: EmailTemplate) => {
    const defaults: Record<string, string> = {};
    template.variables.forEach((v) => {
      defaults[v] = `[${v}]`;
    });
    setVarValues(defaults);
    setPreviewTemplate(template);
    setPreviewHtml(template.generateHtml(defaults));
  };

  const updateVar = (key: string, value: string) => {
    const next = { ...varValues, [key]: value };
    setVarValues(next);
    if (previewTemplate) {
      setPreviewHtml(previewTemplate.generateHtml(next));
    }
  };

  const handleUseInCompose = () => {
    if (!previewTemplate || !onUseInCompose) return;
    let subject = previewTemplate.defaultSubject;
    for (const [k, v] of Object.entries(varValues)) {
      subject = subject.replaceAll(`{{${k}}}`, v);
    }
    onUseInCompose(subject, previewHtml, previewTemplate.key);
    setPreviewTemplate(null);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {EMAIL_TEMPLATES.map((t) => (
          <Card key={t.key}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {t.description}
                  </CardDescription>
                </div>
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {t.variables.map((v) => (
                  <Badge key={v} variant="secondary" className="text-xs">
                    {`{{${v}}}`}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openPreview(t)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Preview
                </Button>
                {onUseInCompose && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => openPreview(t)}
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Use
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Fill in variables and preview the email.
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && previewTemplate.variables.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {previewTemplate.variables.map((v) => (
                <div key={v} className="space-y-1">
                  <Label className="text-xs">{v}</Label>
                  <Input
                    value={varValues[v] ?? ""}
                    onChange={(e) => updateVar(v, e.target.value)}
                    placeholder={v}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="rounded-md border overflow-hidden">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[400px] border-0"
              title="Email preview"
              sandbox=""
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewTemplate(null)}
            >
              Close
            </Button>
            {onUseInCompose && (
              <Button onClick={handleUseInCompose}>
                <Send className="h-4 w-4 mr-2" />
                Use in Compose
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
