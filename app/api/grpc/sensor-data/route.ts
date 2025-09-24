import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { server_address, sensor_data } = await request.json();

    if (!server_address || !sensor_data) {
      return NextResponse.json(
        {
          success: false,
          error: "Server address and sensor data are required",
        },
        { status: 400 }
      );
    }

    console.log(`Processing REAL sensor data via: ${server_address}`);

    // Use the real gRPC client to process sensor data
    try {
      const grpcResult = await callRealGRPCClient("process_sensor_data", { 
        server_address, 
        sensor_data 
      });
      return NextResponse.json(grpcResult);
    } catch (grpcError: any) {
      console.error("gRPC sensor data processing failed:", grpcError);
      
      return NextResponse.json({
        success: false,
        error: `Sensor data processing failed: ${grpcError.message}`,
        analysis: {
          summary: "Failed to process sensor data",
          detailed_analysis: {
            averages: {},
            trends: {},
            alerts: [`Error: ${grpcError.message}`],
            health_score: 0
          }
        },
        recommendations: ["Check connection to load balancer", "Verify sensor data format"]
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Sensor data processing error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to process sensor data: ${error.message}`,
      },
      { status: 500 }
    );
  }
}

async function callRealGRPCClient(action: string, params: any): Promise<any> {
  const grpc = require('@grpc/grpc-js');
  const protoLoader = require('@grpc/proto-loader');
  const path = require('path');
  const fs = require('fs');

  return new Promise((resolve, reject) => {
    try {
      // Find the proto file
      const possibleProtoPaths = [
        path.join(process.cwd(), 'load_balancer.proto'),
        path.join(process.cwd(), '..', 'LB', 'load_balancer.proto'),
        path.join(process.cwd(), '..', 'load_balancer.proto')
      ];

      let protoPath = null;
      for (const p of possibleProtoPaths) {
        if (fs.existsSync(p)) {
          protoPath = p;
          break;
        }
      }

      if (!protoPath) {
        reject(new Error('Proto file not found'));
        return;
      }

      // Load the proto file
      const packageDefinition = protoLoader.loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      });

      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
      const LoadBalancer = protoDescriptor.loadbalancer.LoadBalancer;

      // Create client
      const client = new LoadBalancer(params.server_address, grpc.credentials.createInsecure());

      // Set deadline (30 second timeout for sensor processing)
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 30);

      if (action === 'process_sensor_data') {
        // Convert sensor data to the expected format
        const readings = Object.entries(params.sensor_data)
          .filter(([key]) => !['sensor_id', 'location', 'timestamp'].includes(key))
          .map(([parameter, value]) => ({
            parameter: parameter,
            value: parseFloat(value as string) || 0.0,
            unit: getUnitForParameter(parameter),
            timestamp: Math.floor(Date.now() / 1000)
          }));

        const sensorRequest = {
          sensor_id: params.sensor_data.sensor_id || 'frontend_sensor',
          sensor_type: 'multi_parameter',
          readings: readings,
          timestamp: Math.floor(Date.now() / 1000),
          location: params.sensor_data.location || 'Farm Location'
        };

        client.ProcessSensorData(sensorRequest, { deadline }, (error: any, response: any) => {
          if (error) {
            console.error('gRPC Sensor Data Error:', error);
            reject(error);
          } else {
            console.log('gRPC Sensor Data Success:', response);
            
            resolve({
              success: response.success,
              message: response.message,
              analysis: {
                summary: response.message,
                detailed_analysis: {
                  averages: response.analysis.averages,
                  trends: response.analysis.trends,
                  alerts: response.analysis.alerts,
                  health_score: response.analysis.health_score
                },
                processing_time: 2.0,
                model_used: "agricultural-sensor-processor",
                client_id: "sensor-processor"
              },
              recommendations: response.recommendations
            });
          }
          client.close();
        });
      } else {
        reject(new Error(`Unknown action: ${action}`));
      }

    } catch (error) {
      console.error('gRPC Sensor Data Client Error:', error);
      reject(error);
    }
  });
}

function getUnitForParameter(param: string): string {
  const units: { [key: string]: string } = {
    'temperature': '°C',
    'humidity': '%',
    'soil_moisture': '%',
    'ph_level': 'pH',
    'light': 'lux',
    'pressure': 'hPa'
  };
  return units[param] || '';
}