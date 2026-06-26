export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMonthlyExecutiveSummaryEmail } from "@/lib/email";
import { trackEvent } from "@/lib/events";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const businessUsers = await prisma.user.findMany({
      where: {
        role: "BUSINESS",
        subscriptionStatus: "active",
        emailMonthlySummary: true,
        OR: [
          { subscriptionEndDate: null },
          { subscriptionEndDate: { gt: new Date() } },
        ],
      },
    });

    let sent = 0;

    for (const user of businessUsers) {
      const reports = await prisma.upload.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: since },
        },
        include: {
          client: true,
        },
      });

      const auditsCount = reports.length;

      const totalSavings = reports.reduce((sum, report) => {
        const data = report.parsedData as any;
        return sum + (Number(data?.estimated_savings) || 0);
      }, 0);

      const leakageScores = reports
        .map((report) => Number((report.parsedData as any)?.leakage_score))
        .filter((score) => !Number.isNaN(score));

      const highestRiskScore =
        leakageScores.length > 0 ? Math.max(...leakageScores) : 0;

      const averageLeakageScore =
        leakageScores.length > 0
          ? Math.round(
              leakageScores.reduce((sum, score) => sum + score, 0) /
                leakageScores.length
            )
          : 0;

      const clientMap = new Map<
        string,
        {
          name: string;
          savings: number;
          highestRisk: number;
        }
      >();

      const actionCounts = new Map<string, number>();

      for (const report of reports) {
        const data = report.parsedData as any;
        const clientName = report.client?.name || "Unassigned";

        const current =
          clientMap.get(clientName) || {
            name: clientName,
            savings: 0,
            highestRisk: 0,
          };

        current.savings += Number(data?.estimated_savings || 0);
        current.highestRisk = Math.max(
          current.highestRisk,
          Number(data?.leakage_score || 0)
        );

        clientMap.set(clientName, current);

        const actions = [
          ...(data?.quick_wins || []),
          ...(data?.recommendations || []),
        ];

        for (const action of actions) {
          const text = String(action || "").trim();
          if (!text) continue;
          actionCounts.set(text, (actionCounts.get(text) || 0) + 1);
        }
      }

      const clientStats = Array.from(clientMap.values());

      const topRiskClient =
        clientStats.sort((a, b) => b.highestRisk - a.highestRisk)[0]?.name ||
        null;

      const topSavingsClient =
        clientStats.sort((a, b) => b.savings - a.savings)[0]?.name || null;

      const priorityActions = Array.from(actionCounts.entries())
        .map(([text, count]) => ({ text, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((item) => item.text);

      await sendMonthlyExecutiveSummaryEmail({
        to: user.email,
        companyName: user.companyName,
        auditsCount,
        totalSavings,
        highestRiskScore,
        averageLeakageScore,
        topRiskClient,
        topSavingsClient,
        priorityActions,
      });

      await trackEvent({
        type: "monthly_executive_summary_sent",
        userId: user.id,
        metadata: {
          auditsCount,
          totalSavings,
          highestRiskScore,
          averageLeakageScore,
          topRiskClient,
          topSavingsClient,
          priorityActions,
        },
      });

      sent += 1;
    }

    return NextResponse.json({
      success: true,
      sent,
    });
  } catch (error) {
    console.error("MONTHLY EXECUTIVE SUMMARY ERROR:", error);

    return NextResponse.json(
      { error: "Failed to send monthly executive summaries." },
      { status: 500 }
    );
  }
}
