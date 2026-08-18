const url = process.env.SMOKE_TEST_URL;

if (!url) {
  throw new Error('Set SMOKE_TEST_URL to the deployed backend base URL before running this check');
}

const healthUrl = `${url.replace(/\/$/, '')}/api/health`;
fetch(healthUrl)
  .then(async (response) => {
    if (!response.ok) throw new Error(`Health check returned ${response.status}: ${await response.text()}`);
    console.log(`Health check passed: ${healthUrl}`);
  })
  .catch((error) => {
    console.error(`Health check failed: ${error.message}`);
    process.exitCode = 1;
  });
