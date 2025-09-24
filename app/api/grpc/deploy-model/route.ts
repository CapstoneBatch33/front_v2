import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { server_address, model_name, model_type } = await request.json();

    if (!server_address || !model_name) {
      return NextResponse.json(
        {
          success: false,
          error: "Server address and model name are required",
        },
        { status: 400 }
      );
    }

    console.log(`Deploying model ${model_name} via: ${server_address}`);

    // Use the real gRPC client to deploy model
    try {
      const grpcResult = await callRealGRPCClient("deploy_model", { 
        server_address, 
        model_name, 
        model_type: model_type || "ollama"
      });
      return NextResponse.json(grpcResult);
    } catch (grpcError: any) {
      console.error("gRPC model deployment failed:", grpcError);
      
      return NextResponse.json({
        success: false,
        error: `Model deployment failed: ${grpcError.message}`,
        container_id: "",
        endpoint_url: ""
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Model deployment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Model deployment failed: ${error.message}`,
        container_id: "",
        endpoint_url: ""
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

      // Set deadline (30 second timeout for model deployment)
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 30);

      if (action === 'deploy_model') {
        const deployRequest = {
          model_name: params.model_name,
          model_type: params.model_type,
          docker_image: "", // Server will determine this
          environment_vars: {},
          required_ports: [],
          memory_limit_mb: 0, // Server will determine this
          cpu_limit: 0.0 // Server will determine this
        };

        client.DeployModel(deployRequest, { deadline }, (error: any, response: any) => {
          if (error) {
            console.error('gRPC Deploy Model Error:', error);
            reject(error);
          } else {
            console.log('gRPC Deploy Model Success:', response);
            
            resolve({
              success: response.success,
              message: response.message,
              container_id: response.container_id,
              endpoint_url: response.endpoint_url,
              assigned_port: response.assigned_port
            });
          }
          client.close();
        });
      } else {
        reject(new Error(`Unknown action: ${action}`));
      }

    } catch (error) {
      console.error('gRPC Deploy Model Client Error:', error);
      reject(error);
    }
  });
}