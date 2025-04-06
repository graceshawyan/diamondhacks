import { SerialPort } from 'serialport';

// Configuration for the serial port
const portConfig = {
    // path: '/dev/tty.usbmodem11201',
    path: '/dev/ttyACM0',
    baudRate: 9600,
    autoOpen: false,
    dtr: false,
    rts: false
};

let port = null;

// Initialize the serial port connection
export const initializeArduino = async () => {
    try {
        // List available ports
        const ports = await SerialPort.list();
        console.log('Available Arduino ports:', ports.map(p => p.path));

        // Create and open port
        port = new SerialPort(portConfig);

        // Set up data handler
        port.on('data', (data) => {
            data.toString().trim().split('\n').forEach(line => {
                if (line) console.log('Arduino says:', line);
            });
        });

        // Set up error handler
        port.on('error', (err) => {
            console.error('Serial port error:', err.message);
        });

        // Open the port
        await new Promise((resolve, reject) => {
            port.open((err) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('Serial port opened successfully');
                resolve();
            });
        });

        // Wait for Arduino to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return true;
    } catch (err) {
        console.error('Arduino initialization error:', err.message);
        return false;
    }
};

// Send command to open/close box
export const controlBox = async (action) => {
    if (!port) {
        console.error('Arduino not initialized');
        return false;
    }

    try {
        // Send the move command
        await new Promise((resolve, reject) => {
            port.write('move\n', (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('Move command sent to Arduino');
                resolve();
            });
        });

        return true;
    } catch (err) {
        console.error('Error controlling box:', err.message);
        return false;
    }
};

// Schedule box operations based on medication times
export const scheduleBoxOperations = async (medSchedule) => {
    Object.entries(medSchedule).forEach(([medication, schedule]) => {
        Object.entries(schedule).forEach(([day, times]) => {
            times.forEach(time => {
                const [hours, minutes] = time.split(':').map(Number);
                
                // Schedule box opening
                const openTime = new Date();
                openTime.setHours(hours, minutes, 0, 0);
                
                // If time has passed today, schedule for tomorrow
                if (openTime < new Date()) {
                    openTime.setDate(openTime.getDate() + 1);
                }
                
                // Schedule box opening
                const openDelay = openTime.getTime() - Date.now();
                setTimeout(async () => {
                    console.log(`Opening box for ${medication} at ${time}`);
                    await controlBox('open');
                    
                    // Schedule box closing after 1 hour
                    setTimeout(async () => {
                        console.log(`Closing box for ${medication}`);
                        await controlBox('close');
                    }, 60 * 60 * 1000); // 1 hour in milliseconds
                }, openDelay);
            });
        });
    });
};

// Cleanup function
export const cleanup = async () => {
    if (port) {
        await new Promise((resolve) => {
            console.log('Closing Arduino connection...');
            port.close(() => {
                console.log('Arduino connection closed');
                resolve();
            });
        });
    }
};
