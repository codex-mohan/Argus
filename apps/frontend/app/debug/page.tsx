import React from "react";

export default function DebugPage() {
  return (
    <div className="p-12 font-mono text-white bg-black min-h-screen">
      <h1 className="text-2xl mb-6 text-red-500">Vercel Server Environment Debugger</h1>
      <p className="mb-4 text-white/70">
        This page runs directly on the Vercel server (Next.js Server Component) and reads exactly what environment variables Vercel is seeing.
      </p>
      
      <div className="bg-white/10 p-6 rounded-lg border border-white/20">
        <h2 className="text-xl mb-4 text-yellow-400">Environment Variables:</h2>
        
        <div className="space-y-4">
          <div>
            <span className="text-white/50 block">process.env.ARGUS_API_HOST:</span>
            <span className="text-green-400 text-lg font-bold break-all">
              {process.env.ARGUS_API_HOST || "UNDEFINED (This is the problem!)"}
            </span>
          </div>

          <div>
            <span className="text-white/50 block">process.env.NEXT_PUBLIC_API_URL:</span>
            <span className="text-blue-400 text-lg break-all">
              {process.env.NEXT_PUBLIC_API_URL || "UNDEFINED"}
            </span>
          </div>
          
          <div>
            <span className="text-white/50 block">NODE_ENV:</span>
            <span className="text-white/80">{process.env.NODE_ENV}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200">
        <h3 className="font-bold mb-2">How to fix if ARGUS_API_HOST is undefined:</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Go to Vercel Dashboard → Settings → Environment Variables</li>
          <li>Add ARGUS_API_HOST (value: https://argus-jwzc.onrender.com)</li>
          <li>Go to Deployments tab</li>
          <li>Click Redeploy on your latest commit</li>
        </ol>
      </div>
    </div>
  );
}
