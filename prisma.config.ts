import path from 'path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: "postgresql://postgres.aiqcpbqqvfproxgdzxkp:Kitno%404608888@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres",
  },
});