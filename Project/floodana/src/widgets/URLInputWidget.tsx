"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { X } from "lucide-react";

const urlSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }).min(1, { message: "URL is required" }),
});

type UrlFormValues = z.infer<typeof urlSchema>;

interface URLHistoryItem {
  id: string;
  url: string;
  timestamp: number;
}

interface URLInputWidgetProps {
  onSubmit?: (url: string) => void;
  onSelectHistoryItem?: (url: string) => void;
}

const STORAGE_KEY = "floodana_url_history";

export function URLInputWidget({ onSubmit, onSelectHistoryItem }: URLInputWidgetProps) {
  const [history, setHistory] = useState<URLHistoryItem[]>([]);

  const form = useForm<UrlFormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: "",
    },
  });

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error("Failed to parse URL history:", error);
      }
    }
  }, []);

  // Save to localStorage whenever history changes
  const saveToLocalStorage = (newHistory: URLHistoryItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    setHistory(newHistory);
  };

  const handleSubmit = (data: UrlFormValues) => {
    const newItem: URLHistoryItem = {
      id: crypto.randomUUID(),
      url: data.url,
      timestamp: Date.now(),
    };

    // Add to beginning of history (most recent first)
    const updatedHistory = [newItem, ...history];
    saveToLocalStorage(updatedHistory);

    onSubmit?.(data.url);
    form.reset();
  };

  const handleDelete = (id: string) => {
    const updatedHistory = history.filter((item) => item.id !== id);
    saveToLocalStorage(updatedHistory);
  };

  const handleClearAll = () => {
    saveToLocalStorage([]);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-full flex-col px-3 py-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Floodlight URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="http://localhost:8080"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">
            Update
          </Button>
        </form>
      </Form>

      {history.length > 0 && (
        <div className="mt-6 flex-1">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">History</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-auto px-2 py-1 text-xs"
            >
              Clear all
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-24rem)]">
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-start gap-2 rounded-md border p-2 hover:bg-accent"
                >
                  <button
                    onClick={() => onSelectHistoryItem?.(item.url)}
                    className="flex-1 overflow-hidden text-left"
                  >
                    <p className="truncate text-sm font-medium">{item.url}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.timestamp)}
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="h-auto p-1 opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
