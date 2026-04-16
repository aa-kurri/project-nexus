import { NextRequest, NextResponse } from "next/server";
import { RegionalAssistantAgent } from "@nexus/ai-orchestrator";

export async function POST(req: NextRequest) {
  try {
    const { query, language } = await req.json();

    const agent = new RegionalAssistantAgent();
    // In a real app, query tenant-specific instructions from DB
    const context = "Ayura OS Demonstration - City General Hospital in Vizag, Andhra Pradesh.";
    
    const result = await agent.ask(query, language, context);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Regional Assistant Error:", error);
    return NextResponse.json({ 
      reply: "క్షమించండి, సర్వర్ కనెక్ట్ కావడంలో ఇబ్బంది ఉంది. (Server error)" 
    }, { status: 500 });
  }
}
