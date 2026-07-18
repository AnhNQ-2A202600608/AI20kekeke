export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const isDev = process.env.NODE_ENV === 'development';
    const enableInDev = process.env.NEXT_PUBLIC_ENABLE_POSTHOG_IN_DEV === 'true';
    const disablePostHog = process.env.NEXT_PUBLIC_DISABLE_POSTHOG === 'true';

    // Skip OTEL and PostHog in development mode by default, or if explicitly disabled
    if (disablePostHog || (isDev && !enableInDev)) {
      return;
    }

    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      return;
    }

    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { resourceFromAttributes } = await import('@opentelemetry/resources');
    const { PostHogSpanProcessor } = await import('@posthog/ai/otel');
    const { GenAIInstrumentation } = await import(
      '@traceloop/instrumentation-google-generativeai'
    );

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        'service.name': 'edugap-quiz',
      }),
      spanProcessors: [
        new PostHogSpanProcessor({
          apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
          host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        }),
      ],
      instrumentations: [new GenAIInstrumentation()],
    });

    sdk.start();
  }
}
