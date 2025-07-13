import { testDataService } from './services/testDataService';

async function runTest() {
  console.log('Starting notification trigger test...');
  const success = await testDataService.testNotificationTrigger();
  console.log('Test finished with status:', success ? 'SUCCESS' : 'FAILED');
  process.exit(success ? 0 : 1);
}

runTest(); 