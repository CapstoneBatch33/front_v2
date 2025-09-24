import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { server_address, model_name, prompt, parameters } = await request.json();

    if (!server_address || !model_name || !prompt) {
      return NextResponse.json(
        {
          success: false,
          error: "Server address, model name, and prompt are required",
        },
        { status: 400 }
      );
    }

    console.log(`Making REAL AI request to: ${server_address} with model: ${model_name}`);

    // Use the real gRPC client to make AI request
    try {
      const grpcResult = await callRealGRPCClient("ai_request", { 
        server_address, 
        model_name, 
        prompt, 
        parameters: parameters || {} 
      });
      return NextResponse.json(grpcResult);
    } catch (grpcError: any) {
      console.error("gRPC AI request failed:", grpcError);
      
      return NextResponse.json({
        success: false,
        error: `AI request failed: ${grpcError.message}`,
        response_text: `Error: ${grpcError.message}`
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("AI request error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `AI request failed: ${error.message}`,
        response_text: `Error: ${error.message}`
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

      // Set deadline (60 second timeout for AI requests)
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 60);

      if (action === 'ai_request') {
        const aiRequest = {
          request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          model_name: params.model_name,
          prompt: params.prompt,
          parameters: params.parameters,
          input_data: Buffer.from(''),
          input_type: 'text'
        };

        client.ProcessAIRequest(aiRequest, { deadline }, (error: any, response: any) => {
          if (error) {
            console.error('gRPC AI Request Error:', error);
            reject(error);
          } else {
            console.log('gRPC AI Request Success:', response);
            
            resolve({
              success: response.success,
              request_id: response.request_id,
              response_text: response.response_text,
              processing_time: response.processing_time,
              model_used: response.model_used,
              client_id: response.client_id
            });
          }
          client.close();
        });
      } else {
        reject(new Error(`Unknown action: ${action}`));
      }

    } catch (error) {
      console.error('gRPC AI Request Client Error:', error);
      reject(error);
    }
  });
}