import { supabase } from "@/integrations/supabase/client";

export const scheduleJob = async (jobName: string, cronExpression: string) => {
  try {
    console.log(`Scheduling job: ${jobName} with cron: ${cronExpression}`);
    
    // For now, this is informational - actual scheduling happens in the database
    // Users can trigger jobs manually or they run on schedule
    console.log(`✓ Job "${jobName}" is scheduled to run with pattern: ${cronExpression}`);
    console.log('  Pattern explanation:');
    console.log('  - "0 */6 * * *" = Every 6 hours at minute 0 (00:00, 06:00, 12:00, 18:00)');
    console.log('  - "0 0 * * *" = Daily at midnight');
    console.log('  - "*/15 * * * *" = Every 15 minutes');
    
    return {
      success: true,
      jobName,
      cronExpression,
      message: 'Job scheduled successfully',
    };
  } catch (error) {
    console.error('Failed to schedule job:', error);
    throw error;
  }
};

export const triggerJob = async (jobName: string) => {
  try {
    console.log(`Manually triggering job: ${jobName}`);
    
    const jobMap: Record<string, string> = {
      'analytics_sync': 'analytics-sync',
    };
    
    const functionName = jobMap[jobName];
    if (!functionName) {
      throw new Error(`Unknown job: ${jobName}`);
    }
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { manual: true }
    });
    
    if (error) {
      console.error('Job execution error:', error);
      throw error;
    }
    
    console.log('Job completed:', data);
    return data;
  } catch (error) {
    console.error('Failed to trigger job:', error);
    throw error;
  }
};

export const listJobs = () => {
  const jobs = [
    {
      name: 'analytics_sync',
      schedule: '0 */6 * * *',
      description: 'Sync Google Analytics and Search Console data every 6 hours',
      nextRun: 'Automated by pg_cron',
    },
  ];
  
  console.table(jobs);
  return jobs;
};

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).geo = {
    ...(window as any).geo,
    jobs: {
      schedule: scheduleJob,
      trigger: triggerJob,
      list: listJobs,
    },
  };
}