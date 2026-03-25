"use client";

import { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Send, Users, FileText, History } from "lucide-react";
import ComposeTab from "@/components/admin/email/ComposeTab";
import BulkEmailTab from "@/components/admin/email/BulkEmailTab";
import TemplatesTab from "@/components/admin/email/TemplatesTab";
import HistoryTab from "@/components/admin/email/HistoryTab";
import EmailUsageBanner from "@/components/admin/email/EmailUsageBanner";

export default function EmailCenterPage() {
  const [activeTab, setActiveTab] = useState("compose");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeHtml, setComposeHtml] = useState("");
  const [composeTemplateKey, setComposeTemplateKey] = useState("");

  const handleUseInCompose = (
    subject: string,
    html: string,
    templateKey: string
  ) => {
    setComposeSubject(subject);
    setComposeHtml(html);
    setComposeTemplateKey(templateKey);
    setActiveTab("compose");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Center</h1>
        <p className="text-muted-foreground">
          Send and manage platform emails via Resend.
        </p>
      </div>

      <EmailUsageBanner />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="compose">
            <Send className="h-4 w-4 mr-1.5" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="bulk">
            <Users className="h-4 w-4 mr-1.5" />
            Bulk Email
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-1.5" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-1.5" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <ComposeTab
            key={composeTemplateKey + composeSubject}
            initialSubject={composeSubject}
            initialHtml={composeHtml}
            initialTemplateKey={composeTemplateKey}
          />
        </TabsContent>

        <TabsContent value="bulk">
          <BulkEmailTab />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab onUseInCompose={handleUseInCompose} />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
