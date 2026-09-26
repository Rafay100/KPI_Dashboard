"use client";

import React, { useState } from "react";
import { LucideIcon, ExternalLink, Loader2, Sparkles } from "lucide-react";

export interface ClickUpEmbedProps {
  title: string;
  itemName: string;
  description: string;
  embedUrl?: string;
  envVarName?: string;
  icon: LucideIcon;
  minHeight?: string;
}

export function ClickUpEmbed({
  title,
  itemName,
  description,
  embedUrl,
  envVarName,
  icon: Icon,
  minHeight = "min-h-[720px]",
}: ClickUpEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`glass-card relative w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-[#080d19]/90 backdrop-blur-xl ${minHeight} flex flex-col`}>
      {embedUrl ? (
        <div className="flex flex-col flex-1 w-full h-full">
          {/* Top Bar for Live Embed */}
          <div className="flex items-center justify-between border-b border-slate-800/70 px-5 py-3 bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Live ClickUp Embed &bull; {title}
              </span>
            </div>
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/50 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors"
            >
              <span>Open in ClickUp</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          </div>

          {/* Iframe Viewport */}
          <div className="relative flex-1 w-full min-h-[660px]">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#080d19]/80 backdrop-blur-sm gap-3">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                <p className="text-xs text-slate-400">Loading ClickUp Live View...</p>
              </div>
            )}
            <iframe
              src={embedUrl}
              onLoad={() => setIsLoading(false)}
              className="w-full h-full min-h-[660px] border-0 rounded-b-2xl"
              title={`ClickUp ${title} Embed`}
              allow="camera; microphone; fullscreen; display-capture"
            />
          </div>
        </div>
      ) : (
        /* Empty / Ready Embed Placeholder State */
        <div className="flex flex-1 flex-col items-center justify-center p-8 sm:p-12 text-center my-auto">
          <div className="max-w-lg space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/10">
              <Icon className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-[11px] font-semibold text-blue-400">
                <Sparkles className="h-3 w-3" />
                ClickUp Live Integration
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white">{title} Embed Container</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                {description || `This container is reserved and ready for the live ClickUp ${itemName} embedded view.`}
              </p>
            </div>

            {envVarName && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-left shadow-inner">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span className="font-semibold text-slate-300">Configuration Key</span>
                  <span className="text-[10px] uppercase font-mono text-blue-400">.env.local</span>
                </div>
                <code className="block text-xs font-mono text-cyan-300 break-all select-all bg-slate-950/80 px-2.5 py-1.5 rounded border border-slate-800/80">
                  {envVarName}=https://sharing.clickup.com/...
                </code>
                <p className="mt-2 text-[11px] text-slate-400">
                  Paste the ClickUp public/shared embed URL into your environment configuration to display the live interactive view.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
