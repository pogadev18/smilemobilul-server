# Smilemobilul Backend Service

## Overview

This Node.js application provides the backend service for Smilemobilul, a platform offering mobile dental clinic services. It handles company management, campaign orchestration, service day scheduling, time slot management, employee registration, and booking management.

## Getting Started

### Prerequisites

- Node.js
- npm / pnpm (Node Package Manager)
- PostgreSQL database

### Installation

1.  Clone the repository:

    ```sh
    git clone https://github.com/pogadev18/transactions-journal-server.git
    ```

2.  Install NPM packages
    `pnpm install`
<br/>

3.  Create a `.env` file in the root of the projectand add the following environment variables:

        PORT=8080
        DATABASE_URL=your_database_connection_string
    

    

4.  Runn the application
    `pnpm run dev`
    <br/>

### Features

- **_Company Management_**: Create, retrieve, update, and delete companies.
- **_Campaign Management_**: Create and manage campaigns including setting registration periods.
- **_Service Day Management_**: Add service days to campaigns.
- **_Time Slot Management_**: Manage time slots for service days.
- **_Employee Registration_**: Handle employee registrations with GDPR consent.
- **_Booking Management_**: Manage bookings for time slots.

### Security and Performance

- CORS enabled for handling resources from different origins.
- Helmet for setting various HTTP headers for security.
- Morgan for logging HTTP requests.
- Graceful shutdown for handling termination signals
  <br/>

### Error Handling

Global error handling is implemented to catch and manage errors from across the application (`asyncMiddleware.ts`), ensuring a consistent error response format.

### Graceful Shutdown in Node.js Express Application

Graceful shutdown is a best practice in server applications, ensuring that the server stops serving new requests and closes existing connections smoothly, without abruptly interrupting ongoing processes. The code snippet provided is part of a Node.js Express application and implements graceful shutdown handling.

Node.js provides a way to listen for system signals. In this case, the application listens for two types of signals: SIGINT and SIGTERM. These signals are used to notify the process that it should perform a graceful shutdown.

```
process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
```
- SIGINT (Signal Interrupt) is typically sent when a user presses Ctrl+C in the terminal where the Node.js application is running.
- When the SIGINT signal is received, the application logs that it has received this signal.
- It then attempts to close the server gracefully by calling server.close().
- The server.close() method stops the server from accepting new connections and keeps existing connections open until they are handled.
- Once the server is successfully closed, a callback function logs that the HTTP server is closed.

```
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
```
- SIGTERM (Signal Terminate) is sent by system utilities or other applications to indicate that the process should terminate.
- It is a polite request to the process to terminate its execution. This is the signal commonly used in server environments like when stopping a Docker container or when an operating system shuts down.
- Similar to SIGINT, upon receiving SIGTERM, the application logs the receipt of this signal and proceeds to gracefully shut down the HTTP server

#### Importance
Implementing graceful shutdown:

- Ensures that ongoing requests are not abruptly terminated, providing a better user experience and data integrity.
- Allows the application to release resources, such as database connections or file handles, correctly.
- Helps in scenarios like deployment of new versions or server maintenance.

In simple terms, this code makes sure that when you tell your server to stop, it finishes serving any ongoing requests and then shuts down gently, without causing any disruptions or data loss.