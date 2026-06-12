export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { exec } = await import('child_process');
    const path = await import('path');
    const scriptPath = path.join(process.cwd(), 'scripts/ensure-critical-users.mjs');
    console.log('🚀 Starting CYH OS Instrumentation: Ensuring critical users...');
    exec(`node "${scriptPath}"`, (err, stdout, stderr) => {
      if (err) {
        console.error('❌ Failed to run critical users validation script:', err);
      } else {
        console.log(stdout);
        if (stderr) console.error('⚠️ Critical users validation warning/error:', stderr);
      }
    });
  }
}
