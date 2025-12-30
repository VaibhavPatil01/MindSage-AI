import { inngest } from "./client";
import { functions as aiFunctions } from "./aiFunctions";

export const therapySessionHandler = inngest.createFunction(
  { id: "therapy-session-handler" },
  { event: "therapy/session.created" },
  async ({ event, step }) => {
    await step.run("log-session-creation", async () => {
      console.log("New therapy session created:", event.data);
    });

    const processedData = await step.run("process-session-data", async () => {
      return {
        ...event.data,
        processedAt: new Date().toISOString(),
      };
    });

    if (event.data.requiresFollowUp) {
      await step.run("send-follow-up", async () => {
        console.log("Sending follow-up for session:", event.data.sessionId);
      });
    }

    return {
      message: "Therapy session processed successfully",
      sessionId: event.data.sessionId,
      processedData,
    };
  }
);

export const moodTrackingHandler = inngest.createFunction(
  { id: "mood-tracking-handler" },
  { event: "mood/updated" },
  async ({ event, step }) => {
    await step.run("log-mood-update", async () => {
      console.log("Mood update received:", event.data);
    });

    const analysis = await step.run("analyze-mood-patterns", async () => {
      return {
        trend: "improving",
        recommendations: ["Consider scheduling a therapy session"],
      };
    });

    if (event.data.mood < 3) {
      await step.run("trigger-alert", async () => {
        console.log("Triggering alert for concerning mood:", event.data);
      });
    }

    return {
      message: "Mood update processed",
      analysis,
    };
  }
);

export const activityCompletionHandler = inngest.createFunction(
  { id: "activity-completion-handler" },
  { event: "activity/completed" },
  async ({ event, step }) => {
    await step.run("log-activity-completion", async () => {
      console.log("Activity completed:", event.data);
    });

    const progress = await step.run("update-progress", async () => {
      return {
        completedActivities: 1,
        totalPoints: 10,
      };
    });

    const achievements = await step.run("check-achievements", async () => {
      return {
        newAchievements: ["First Activity Completed"],
      };
    });

    return {
      message: "Activity completion processed",
      progress,
      achievements,
    };
  }
);

export const functions = [
  therapySessionHandler,
  moodTrackingHandler,
  activityCompletionHandler,
  ...aiFunctions,
];
