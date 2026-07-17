import { createMDX } from 'fumadocs-mdx/next';
import type {NextConfig} from 'next';

const disableDocs = process.env.DISABLE_DOCS === 'true';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  serverExternalPackages: [
    '@opentelemetry/sdk-node',
    '@opentelemetry/resources',
    '@traceloop/instrumentation-google-generativeai',
    '@posthog/ai/otel'
  ],
  typescript: {
    ignoreBuildErrors: false,
  },
  outputFileTracingIncludes: {
    '/api/guidebook/[slug]': ['./knowledge/**/*'],
    '/api/questions': ['./public/quiz-manifest.json', './public/quizzes/**/*'],
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  async rewrites() {
    return [
      // `/api/v1/*` is handled by app/api/v1/[...path]/route.ts so the
      // frontend can convert Supabase cookies into FastAPI bearer auth.
      // PostHog analytics proxy
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/array/:path*',
        destination: 'https://us-assets.i.posthog.com/array/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
  skipTrailingSlashRedirect: true,
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/.source/**'],
      };
    }
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

// Vô hiệu hóa biên dịch tài liệu nếu biến môi trường DISABLE_DOCS=true
export default disableDocs ? nextConfig : createMDX()(nextConfig);
