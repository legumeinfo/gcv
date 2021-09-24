# Legumeinfo Microservices

The Genome Context Viewer (GCV) backend is implemented as microservices, which are available via the Legume Information System's [microservices repository](https://github.com/legumeinfo/microservices).
Each microservice uses [gRPC](https://grpc.io/) [protocol buffers](https://developers.google.com/protocol-buffers) (`.proto` files) to define its API.
This is a pseudo-package used to gather and compile the microservices' `.proto` files into a TypeScript library containing [gRPC-web](https://github.com/grpc/grpc-web) client stubs, which GCV uses to send requests to the microservices.

