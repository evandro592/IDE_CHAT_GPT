declare global {
  interface Window {
    MonacoEnvironment: {
      getWorker(workerId: string, label: string): Worker;
    };
  }
}

export {};