import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { server_address } = await request.json();

    if (!server_address) {
      return NextResponse.json({
        success: false,
        error: "Server address is required"
      }, { status: 400 });
    }

    console.log(`Simple health check to: ${server_address}`);

    // Try to make a direct gRPC call without any complex setup
    try {
      const grpc = require('@grpc/grpc-js');
      const protoLoader = require('@grpc/proto-loader');
      const path = require('path');
      const fs = require('fs');

      // Find proto file
      const protoPath = path.join(process.cwd(), '..', 'LB', 'load_balancer.proto');
      
      if (!fs.existsSync(protoPath)) {
        throw new Error('Proto file not found at: ' + protoPath);
      }

      // Load proto
      const packageDefinition = protoLoader.loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      });

      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
      const LoadBalancer = protoDescriptor.loadbalancer.LoadBalancer;

      // Create client and test
      const client = new LoadBalancer(server_address, grpc.credentials.createInsecure());

      return new Promise((resolve) => {
        const deadline = new Date();
        deadline.setSeconds(deadline.getSeconds() + 10);

        client.HealthCheck({}, { deadline }, (error: any, response: any) => {
          client.close();
          
          if (error) {
            console.error('gRPC Error:', error);
            resolve(NextResponse.json({
              success: false,
              error: `gRPC Error: ${error.message}`,
              details: error.code || 'UNKNOWN'
            }, { status: 500 }));
          } else {
            console.log('gRPC Success:', response);
            resolve(NextResponse.json({
              success: true,
              health: {
                healthy: response.healthy,
                message: response.message,
                timestamp: response.timestamp
              }
            }));
          }
        });
      });

    } catch (grpcError: any) {
      console.error('Setup error:', grpcError);
      return NextResponse.json({
        success: false,
        error: `Setup failed: ${grpcError.message}`
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Request error:', error);
    return NextResponse.json({
      success: false,
      error: `Request failed: ${error.message}`
    }, { status: 500 });
  }
}