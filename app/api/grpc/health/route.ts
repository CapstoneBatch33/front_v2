import { spawn } from "child_process";
import path from "path";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import path from "path";
import path from "path";
import path from "path";
import path from "path";
import path from "path";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { server_address } = await request.json();

    if (!server_address) {
      return NextResponse.json(
        {
          success: false,
          error: "Server address is required",
        },
        { status: 400 }
      );
    }

    console.log(`Testing REAL connection to: ${server_address}`);

    // Use the real gRPC client to test connection
    try {
      const grpcResult = await callRealGRPCClient("health_check", { server_address });
      return NextResponse.json(grpcResult);
    } catch (grpcError: any) {
      console.error("gRPC connection failed:", grpcError);
      
      // Handle specific gRPC errors
      if (grpcError.message.includes("UNAVAILABLE")) {
        return NextResponse.json({
          success: false,
          error: `Cannot connect to load balancer at ${server_address}. Make sure the server is running.`
        }, { status: 500 });
      } else if (grpcError.message.includes("DEADLINE_EXCEEDED")) {
        return NextResponse.json({
          success: false,
          error: `Connection timeout to ${server_address}. Server may be overloaded.`
        }, { status: 500 });
      } else {
        return NextResponse.json({
          success: false,
          error: `Connection failed: ${grpcError.message}`
        }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to connect to load balancer: ${error.message}`,
      },
      { status: 500 }
    );
  }
}

async function callRealGRPCClient(action: string, params: any): Promise<any> {
  // Import the Node.js gRPC client
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
        reject(new Error('Proto file not found. Make sure load_balancer.proto exists.'));
        return;
      }

      console.log(`Using proto file: ${protoPath}`);

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

      // Set deadline (10 second timeout)
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 10);

      if (action === 'health_check') {
        client.HealthCheck({}, { deadline }, (error: any, response: any) => {
          if (error) {
            console.error('gRPC Health Check Error:', error);
            reject(error);
          } else {
            console.log('gRPC Health Check Success:', response);
            resolve({
              success: true,
              health: {
                healthy: response.healthy,
                message: response.message,
                timestamp: response.timestamp
              }
            });
          }
          client.close();
        });
      } else {
        reject(new Error(`Unknown action: ${action}`));
      }

    } catch (error) {
      console.error('gRPC Client Setup Error:', error);
      reject(error);
    }
  });
}

async function callPythonGRPCClient(action: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    // Try different possible locations for the gRPC bridge script
    const possiblePaths = [
      path.join(process.cwd(), "..", "LB", "scripts", "grpc_bridge.py"), // New structure
      path.join(process.cwd(), "..", "scripts", "grpc_bridge.py"), // Old structure
      path.join(process.cwd(), "scripts", "grpc_bridge.py"), // Same directory
    ];

    let pythonScript = "";
    for (const scriptPath of possiblePaths) {
      try {
        if (require("fs").existsSync(scriptPath)) {
          pythonScript = scriptPath;
          break;
        }
      } catch (e) {
        // Continue to next path
      }
    }

    if (!pythonScript) {
      reject(
        new Error(
          "gRPC bridge script not found. Make sure LB/scripts/grpc_bridge.py exists."
        )
      );
      return;
    }

    // Try to use virtual environment python first, then fallback to system python
    const pythonCommands = [
      path.join(process.cwd(), "..", "LB", "venv", "bin", "python"), // LB venv Linux
      path.join(process.cwd(), "..", "LB", "venv", "Scripts", "python.exe"), // LB venv Windows
      path.join(process.cwd(), "..", "venv", "bin", "python"), // Old venv Linux
      path.join(process.cwd(), "..", "venv", "Scripts", "python.exe"), // Old venv Windows
      "python3", // System python3
      "python", // System python
    ];

    let pythonCmd = "python3"; // Default fallback

    // Find the first available python command
    for (const cmd of pythonCommands) {
      try {
        if (cmd.includes("python.exe") || cmd.includes("/python")) {
          if (require("fs").existsSync(cmd)) {
            pythonCmd = cmd;
            break;
          }
        }
      } catch (e) {
        // Continue to next option
      }
    }

    console.log(`Using Python: ${pythonCmd}`);
    console.log(`Using script: ${pythonScript}`);

    const python = spawn(
      pythonCmd,
      [pythonScript, action, JSON.stringify(params)],
      {
        env: {
          ...process.env,
          PYTHONPATH: path.join(path.dirname(pythonScript), ".."),
          PATH: process.env.PATH,
        },
      }
    );

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("close", (code) => {
      console.log(`Python script exited with code: ${code}`);
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);

      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${stdout}`));
        }
      } else {
        reject(
          new Error(
            `Python script failed (code ${code}): ${
              stderr || "No error details"
            }`
          )
        );
      }
    });

    python.on("error", (error) => {
      reject(new Error(`Failed to start Python script: ${error.message}`));
    });
  });
}
