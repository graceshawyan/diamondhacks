import { initializeArduino, controlBox, cleanup } from './controller/arduinoController.js';

async function testArduinoMotion() {
    try {
        // Initialize the Arduino connection
        console.log('Initializing Arduino...');
        const initialized = await initializeArduino();
        if (!initialized) {
            console.error('Failed to initialize Arduino');
            return;
        }

        // Send the motion command
        console.log('Sending motion command...');
        const success = await controlBox();
        if (success) {
            console.log('Motion command executed successfully');
        } else {
            console.error('Failed to execute motion command');
        }

        // Clean up the connection
        await cleanup();
        
    } catch (error) {
        console.error('Test failed:', error);
        await cleanup();
    }
}

// Run the test
testArduinoMotion();
